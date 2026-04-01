import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createInstance, getQRCode } from '@/services/whatsapp-qr.service'

export const dynamic = 'force-dynamic'

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  // Ensure instance exists
  await createInstance(tenantId)

  const qr = await getQRCode(tenantId)
  if (!qr) {
    return NextResponse.json(
      { error: 'QR code não disponível. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY.' },
      { status: 503 }
    )
  }

  return NextResponse.json(qr)
}
