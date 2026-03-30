import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { tenantUsers: { take: 1 } },
  })
  const tenantId = dbUser?.tenantUsers[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const [counts, avgMetrics, messageStats] = await Promise.all([
    prisma.customer.groupBy({
      by: ['lifecycleStage'],
      where: { tenantId, deletedAt: null },
      _count: true,
    }),
    prisma.customerMetrics.aggregate({
      where: { tenantId },
      _avg: { avgTicket: true, avgDaysBetweenVisits: true, ltv: true },
      _sum: { totalSpent: true },
    }),
    prisma.outboundMessage.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    }),
  ])

  const countMap = Object.fromEntries(counts.map((c) => [c.lifecycleStage, c._count]))
  const msgMap = Object.fromEntries(messageStats.map((m) => [m.status, m._count]))
  const totalCustomers = counts.reduce((s, c) => s + c._count, 0)
  const recurringCount = (countMap.RECURRING ?? 0) + (countMap.VIP ?? 0)
  const messagesSent = (msgMap.SENT ?? 0) + (msgMap.DELIVERED ?? 0) + (msgMap.READ ?? 0)
  const messagesDelivered = (msgMap.DELIVERED ?? 0) + (msgMap.READ ?? 0)

  return NextResponse.json({
    totalCustomers,
    newCustomers: countMap.NEW ?? 0,
    activeCustomers: countMap.ACTIVE ?? 0,
    recurringCustomers: countMap.RECURRING ?? 0,
    vipCustomers: countMap.VIP ?? 0,
    atRiskCustomers: countMap.AT_RISK ?? 0,
    lostCustomers: countMap.LOST ?? 0,
    dormantCustomers: countMap.DORMANT ?? 0,
    retentionRate: totalCustomers > 0 ? Math.round((recurringCount / totalCustomers) * 100) : 0,
    avgTicket: avgMetrics._avg.avgTicket ?? 0,
    avgDaysBetweenVisits: avgMetrics._avg.avgDaysBetweenVisits ?? 0,
    avgLTV: avgMetrics._avg.ltv ?? 0,
    totalRevenue: avgMetrics._sum.totalSpent ?? 0,
    messagesSent,
    messagesDelivered,
    deliveryRate: messagesSent > 0 ? Math.round((messagesDelivered / messagesSent) * 100) : 0,
  })
}
