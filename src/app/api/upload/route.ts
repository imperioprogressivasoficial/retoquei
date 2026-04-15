import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getServerSalon } from '@/lib/auth'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const BUCKET_NAME = 'media'

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Arquivo excede 10MB' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo não permitido. Use JPG, PNG, WEBP, GIF ou PDF.' },
        { status: 400 },
      )
    }

    const supabase = await createAdminClient()

    // Ensure bucket exists (idempotent)
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const exists = buckets?.some((b) => b.name === BUCKET_NAME)
      if (!exists) {
        await supabase.storage.createBucket(BUCKET_NAME, { public: true })
      }
    } catch {
      // Non-fatal: bucket may already exist
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
    const path = `${salon.id}/${Date.now()}-${safeName}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao fazer upload: ' + uploadError.message },
        { status: 500 },
      )
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)

    return NextResponse.json({
      url: urlData.publicUrl,
      type: file.type,
      name: file.name,
      size: file.size,
      path,
    })
  } catch (err: any) {
    console.error('POST /api/upload error:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar upload' },
      { status: 500 },
    )
  }
}
