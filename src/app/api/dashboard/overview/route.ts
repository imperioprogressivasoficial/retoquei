import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  // Calculate start of current month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    counts,
    avgMetrics,
    messageStats,
    newCustomersThisMonth,
    totalAtRiskCount,
  ] = await Promise.all([
    // All customers by lifecycle stage
    prisma.customer.groupBy({
      by: ['lifecycleStage'],
      where: { tenantId, deletedAt: null },
      _count: true,
    }),
    // Average metrics
    prisma.customerMetrics.aggregate({
      where: { tenantId },
      _avg: { avgTicket: true, avgDaysBetweenVisits: true, ltv: true },
      _sum: { totalSpent: true },
    }),
    // Message stats (this month)
    prisma.outboundMessage.groupBy({
      by: ['status'],
      where: { tenantId, createdAt: { gte: monthStart } },
      _count: true,
    }),
    // New customers created this month
    prisma.customer.count({
      where: {
        tenantId,
        deletedAt: null,
        createdAt: { gte: monthStart },
      },
    }),
    // Count of at-risk customers
    prisma.customer.count({
      where: {
        tenantId,
        deletedAt: null,
        lifecycleStage: 'AT_RISK',
      },
    }),
  ])

  const countMap = Object.fromEntries(counts.map((c) => [c.lifecycleStage, c._count]))
  const msgMap = Object.fromEntries(messageStats.map((m) => [m.status, m._count]))
  const totalCustomers = counts.reduce((s, c) => s + c._count, 0)
  const recurringCount = (countMap.RECURRING ?? 0) + (countMap.VIP ?? 0)
  const messagesSent = (msgMap.SENT ?? 0) + (msgMap.DELIVERED ?? 0) + (msgMap.READ ?? 0)
  const messagesDelivered = (msgMap.DELIVERED ?? 0) + (msgMap.READ ?? 0)
  const messagesRead = msgMap.READ ?? 0
  const messagesFailed = msgMap.FAILED ?? 0
  const atRiskPercentage = totalCustomers > 0 ? Math.round((totalAtRiskCount / totalCustomers) * 100) : 0

  return NextResponse.json({
    totalCustomers,
    newCustomersThisMonth,
    newCustomers: countMap.NEW ?? 0,
    activeCustomers: countMap.ACTIVE ?? 0,
    recurringCustomers: countMap.RECURRING ?? 0,
    vipCustomers: countMap.VIP ?? 0,
    atRiskCustomers: totalAtRiskCount,
    atRiskPercentage,
    lostCustomers: countMap.LOST ?? 0,
    dormantCustomers: countMap.DORMANT ?? 0,
    retentionRate: totalCustomers > 0 ? Math.round((recurringCount / totalCustomers) * 100) : 0,
    avgTicket: avgMetrics._avg.avgTicket ?? 0,
    avgDaysBetweenVisits: avgMetrics._avg.avgDaysBetweenVisits ?? 0,
    avgLTV: avgMetrics._avg.ltv ?? 0,
    totalRevenue: avgMetrics._sum.totalSpent ?? 0,
    messaging: {
      messagesSent,
      messagesDelivered,
      messagesRead,
      messagesFailed,
      deliveryRate: messagesSent > 0 ? Math.round((messagesDelivered / messagesSent) * 100) : 0,
      readRate: messagesSent > 0 ? Math.round((messagesRead / messagesSent) * 100) : 0,
      failureRate: messagesSent > 0 ? Math.round((messagesFailed / messagesSent) * 100) : 0,
    },
  })
}
