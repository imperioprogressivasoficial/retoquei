import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getConnectionStatus, isEvolutionApiConfigured } from '@/services/whatsapp-qr.service'

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

  const configured = isEvolutionApiConfigured()
  if (!configured) {
    return NextResponse.json({
      state: 'not_configured',
      configured: false,
      metaConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    })
  }

  const status = await getConnectionStatus(tenantId)
  return NextResponse.json({ ...status, configured: true })
}
