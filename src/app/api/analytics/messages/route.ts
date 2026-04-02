import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

// ---------------------------------------------------------------------------
// GET /api/analytics/messages — Comprehensive message analytics
// Returns: sent count, delivery rate, read rate, response rate by type/template
// ---------------------------------------------------------------------------
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

  // Calculate month boundaries
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Query message stats
  const [
    totalStats,
    monthlyStats,
    statusBreakdown,
    templateStats,
    channelStats,
    campaignStats,
  ] = await Promise.all([
    // All-time stats
    prisma.outboundMessage.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    }),

    // This month stats
    prisma.outboundMessage.groupBy({
      by: ['status'],
      where: { tenantId, createdAt: { gte: monthStart, lte: monthEnd } },
      _count: true,
    }),

    // Status breakdown with detailed counts
    prisma.outboundMessage.findMany({
      where: { tenantId },
      select: { status: true, createdAt: true, deliveredAt: true, readAt: true },
    }),

    // Stats by template
    prisma.outboundMessage.groupBy({
      by: ['templateId'],
      where: { tenantId, templateId: { not: null } },
      _count: true,
    }),

    // Stats by channel
    prisma.outboundMessage.groupBy({
      by: ['channel'],
      where: { tenantId },
      _count: true,
    }),

    // Stats by campaign with campaign names
    prisma.campaign.findMany({
      where: { tenantId },
      include: {
        _count: { select: { outboundMessages: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Calculate rates
  const calcStats = (stats: any[]) => {
    const map = Object.fromEntries(stats.map((s) => [s.status || s.channel, s._count]))
    const sent = map.SENT || 0
    const delivered = map.DELIVERED || 0
    const read = map.READ || 0
    const failed = map.FAILED || 0
    const total = sent + delivered + read + failed + (map.QUEUED || 0) + (map.PENDING || 0) + (map.OPTED_OUT || 0)

    return {
      total,
      sent,
      delivered,
      read,
      failed,
      queued: map.QUEUED || 0,
      pending: map.PENDING || 0,
      optedOut: map.OPTED_OUT || 0,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
      readRate: sent > 0 ? Math.round((read / sent) * 100) : 0,
      failureRate: sent > 0 ? Math.round((failed / sent) * 100) : 0,
    }
  }

  const allTimeStats = calcStats(totalStats)
  const thisMonthStats = calcStats(monthlyStats)

  // Get template names and stats
  const templateMap = new Map(
    (await prisma.messageTemplate.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    })).map((t) => [t.id, t.name])
  )

  const templateStats_ = templateStats
    .filter((s) => s.templateId)
    .map((s) => ({
      templateId: s.templateId,
      templateName: templateMap.get(s.templateId) || 'Unknown',
      count: s._count,
    }))
    .sort((a, b) => b.count - a.count)

  // Channel breakdown
  const channelStats_ = channelStats
    .map((s) => ({
      channel: s.channel,
      count: s._count,
    }))
    .sort((a, b) => b.count - a.count)

  // Campaign stats
  const campaignStats_ = campaignStats
    .filter((c) => c._count.outboundMessages > 0)
    .map((c) => ({
      campaignId: c.id,
      campaignName: c.name,
      status: c.status,
      sentCount: c.sentCount,
      deliveredCount: c.deliveredCount,
      readCount: c.readCount,
      messageCount: c._count.outboundMessages,
    }))
    .sort((a, b) => b.messageCount - a.messageCount)

  return NextResponse.json({
    period: {
      start: monthStart.toISOString(),
      end: monthEnd.toISOString(),
    },
    allTime: allTimeStats,
    thisMonth: thisMonthStats,
    byTemplate: templateStats_,
    byChannel: channelStats_,
    byCampaign: campaignStats_,
  })
}
