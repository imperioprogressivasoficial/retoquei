import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { ownedTenants: { include: { tenant: true }, take: 1 } },
    })
    const tenant = dbUser?.ownedTenants[0]?.tenant
    if (!tenant) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

    const now = new Date()
    const [totalCustomers, messagesSentThisMonth] = await Promise.all([
      prisma.customer.count({ where: { tenantId: tenant.id, deletedAt: null } }),
      prisma.usageCounter.findFirst({
        where: {
          tenantId: tenant.id,
          metric: 'messages_sent',
          periodYear: now.getFullYear(),
          periodMonth: now.getMonth() + 1,
        },
      }),
    ])

    return NextResponse.json({
      currentPlan: tenant.plan,
      stripeCustomerId: tenant.stripeCustomerId,
      totalCustomers,
      messagesSentThisMonth: messagesSentThisMonth?.value ?? 0,
    })
  } catch (err) {
    console.error('[billing/info] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
