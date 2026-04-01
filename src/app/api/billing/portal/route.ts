import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createBillingPortalSession } from '@/services/stripe.service'

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const session = await createBillingPortalSession(tenantId, `${appUrl}/billing`)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing/portal] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
