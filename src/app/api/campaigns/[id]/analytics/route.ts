import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// GET /api/campaigns/[id]/analytics — Campaign-specific message tracking
// Returns: ROI, A/B test results, message correlation, delivery rates
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  // Get campaign with messages
  const campaign = await prisma.campaign.findFirst({
    where: { id, tenantId },
    include: {
      template: true,
      segment: true,
      outboundMessages: {
        include: {
          customer: { select: { id: true, fullName: true, phoneE164: true } },
          events: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const messages = campaign.outboundMessages

  // Calculate metrics
  const totalMessages = messages.length
  const sent = messages.filter((m) => ['SENT', 'DELIVERED', 'READ'].includes(m.status)).length
  const delivered = messages.filter((m) => ['DELIVERED', 'READ'].includes(m.status)).length
  const read = messages.filter((m) => m.status === 'READ').length
  const failed = messages.filter((m) => m.status === 'FAILED').length
  const optedOut = messages.filter((m) => m.status === 'OPTED_OUT').length

  // Response tracking via inbound messages from customers
  const sentCustomerIds = new Set(messages.map((m) => m.customerId).filter(Boolean))
  const responses = await prisma.inboundMessage.count({
    where: {
      tenantId,
      customerId: { in: Array.from(sentCustomerIds) },
      receivedAt: { gte: campaign.startedAt || new Date(0) },
    },
  })

  // Click tracking would require URL tracking in template body
  // For now, we'll calculate response rate from inbound messages
  const responseRate = sent > 0 ? Math.round((responses / sent) * 100) : 0

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      createdAt: campaign.createdAt,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
      template: campaign.template ? { id: campaign.template.id, name: campaign.template.name } : null,
      segment: campaign.segment ? { id: campaign.segment.id, name: campaign.segment.name } : null,
    },
    messageTracking: {
      total: totalMessages,
      sent,
      delivered,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
      read,
      readRate: sent > 0 ? Math.round((read / sent) * 100) : 0,
      failed,
      failureRate: sent > 0 ? Math.round((failed / sent) * 100) : 0,
      optedOut,
    },
    responseTracking: {
      responses,
      responseRate,
      customersWhoResponded: responses > 0 ? responses : 0,
    },
    timeline: {
      createdAt: campaign.createdAt,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
      duration: campaign.startedAt && campaign.completedAt
        ? Math.round((campaign.completedAt.getTime() - campaign.startedAt.getTime()) / 1000 / 60) // minutes
        : null,
    },
    messages: messages.slice(0, 10).map((m) => ({
      id: m.id,
      customerId: m.customerId,
      customerName: m.customer?.fullName,
      toNumber: m.toNumber,
      status: m.status,
      sentAt: m.sentAt,
      deliveredAt: m.deliveredAt,
      readAt: m.readAt,
      eventCount: m.events.length,
      events: m.events.slice(0, 3),
    })),
  })
}
