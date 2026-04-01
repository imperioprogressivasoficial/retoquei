import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const BUCKET = 'csv-imports'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin credentials not configured')
  return createAdmin(url, key, { auth: { persistSession: false } })
}

async function ensureBucket(admin: ReturnType<typeof createAdmin>) {
  const { data: buckets } = await admin.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === BUCKET)
  if (!exists) {
    await admin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 52428800, // 50 MB
      allowedMimeTypes: ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/octet-stream'],
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { ownedTenants: { take: 1 } },
    })
    const tenantId = dbUser?.ownedTenants[0]?.tenantId
    if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

    const { fileName } = await req.json()
    if (!fileName) return NextResponse.json({ error: 'fileName é obrigatório' }, { status: 400 })

    const admin = getAdminClient()
    await ensureBucket(admin)

    const ext = fileName.endsWith('.csv') ? '.csv' : '.csv'
    const storagePath = `${tenantId}/${Date.now()}${ext}`

    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      console.error('[storage-url] createSignedUploadUrl error:', error)
      return NextResponse.json({ error: 'Erro ao gerar URL de upload' }, { status: 500 })
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      storagePath,
    })
  } catch (err) {
    console.error('[storage-url] Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
