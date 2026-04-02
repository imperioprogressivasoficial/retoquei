import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// GET /api/messages/tracking — Get message tracking status
// Query params: messageId or providerId
// Returns: delivery status, read status, response tracking
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

  const url = new URL(req.url)
  const messageId = url.searchParams.get('messageId')
  const providerId = url.searchParams.get('providerId')

  if (!messageId && !providerId) {
    return NextResponse.json({ error: 'Either messageId or providerId required' }, { status: 400 })
  }

  const where: any = { tenantId }
  if (messageId) where.id = messageId
  if (providerId) where.providerMessageId = providerId

  const message = await prisma.outboundMessage.findFirst({
    where,
    include: {
      customer: { select: { id: true, fullName: true, phoneE164: true } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  // Check for responses from this customer
  let hasResponse = false
  let responseCount = 0
  if (message.customerId) {
    responseCount = await prisma.inboundMessage.count({
      where: {
        tenantId,
        customerId: message.customerId,
        receivedAt: { gte: message.sentAt || new Date(0) },
      },
    })
    hasResponse = responseCount > 0
  }

  // Check if message contains trackable links (basic check)
  const hasTrackableLinks = message.bodyRendered?.includes('http') ?? false

  return NextResponse.json({
    message: {
      id: message.id,
      providerId: message.providerMessageId,
      status: message.status,
      channel: message.channel,
      to: message.toNumber,
      body: message.bodyRendered.substring(0, 100) + (message.bodyRendered.length > 100 ? '...' : ''),
    },
    tracking: {
      status: {
        current: message.status,
        queued: message.status === 'QUEUED',
        sent: message.status === 'SENT' || message.status === 'DELIVERED' || message.status === 'READ',
        delivered: message.status === 'DELIVERED' || message.status === 'READ',
        read: message.status === 'READ',
        failed: message.status === 'FAILED',
      },
      timestamps: {
        created: message.createdAt,
        sent: message.sentAt,
        delivered: message.deliveredAt,
        read: message.readAt,
      },
      response: {
        hasResponse,
        responseCount,
      },
      linkTracking: {
        hasTrackableLinks,
        clickCount: message.events.filter((e) => e.eventType === 'click').length,
      },
    },
    timeline: message.events.map((e) => ({
      type: e.eventType,
      timestamp: e.createdAt,
      payload: e.payload,
    })),
  })
}
