import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { QUEUES } from '@/lib/redis'

// ---------------------------------------------------------------------------
// GET /api/outbound-messages — List messages with filters
// ---------------------------------------------------------------------------
const listSchema = z.object({
  campaignId: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(['PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'OPTED_OUT']).optional(),
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(100).default(20),
})

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

  // Parse query parameters
  const params = Object.fromEntries(
    [...new URL(req.url).searchParams.entries()].map(([k, v]) => [
      k,
      ['skip', 'take'].includes(k) ? parseInt(v) : v,
    ])
  )

  const result = listSchema.safeParse(params)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { campaignId, customerId, status, channel, startDate, endDate, skip, take } = result.data

  const where: any = { tenantId }
  if (campaignId) where.campaignId = campaignId
  if (customerId) where.customerId = customerId
  if (status) where.status = status
  if (channel) where.channel = channel
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  const [messages, total] = await Promise.all([
    prisma.outboundMessage.findMany({
      where,
      include: { customer: { select: { id: true, fullName: true, phoneE164: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.outboundMessage.count({ where }),
  ])

  return NextResponse.json({
    messages,
    pagination: { skip, take, total, pages: Math.ceil(total / take) },
  })
}

// ---------------------------------------------------------------------------
// POST /api/outbound-messages — Create/send a message
// ---------------------------------------------------------------------------
const createSchema = z.object({
  customerId: z.string().optional(),
  templateId: z.string().optional(),
  campaignId: z.string().optional(),
  flowId: z.string().optional(),
  toNumber: z.string().min(8),
  bodyRendered: z.string().min(1),
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL']).default('WHATSAPP'),
  scheduledAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const body = await req.json()
  const result = createSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { customerId, templateId, campaignId, flowId, toNumber, bodyRendered, channel, scheduledAt } = result.data

  // Create the outbound message
  const message = await prisma.outboundMessage.create({
    data: {
      tenantId,
      customerId: customerId || null,
      templateId: templateId || null,
      campaignId: campaignId || null,
      flowId: flowId || null,
      channel,
      toNumber,
      bodyRendered,
      status: scheduledAt ? 'PENDING' : 'QUEUED',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  })
  // Enqueue to message-send queue if not scheduled
  let jobId: string | null = null
  if (!scheduledAt) {
    try {
      const queue = QUEUES.messageSendQueue
      const job = await queue.add(`send-${message.id}`, {
        messageId: message.id,
        tenantId,
        toNumber,
        body: bodyRendered,
        channel,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      })
      jobId = job.id
    } catch (err) {
      console.error(`[OutboundMessage] Failed to queue job for ${message.id}:`, err)
    }
  }
  console.log(`[OutboundMessage] Created message ${message.id}`)

  return NextResponse.json({ message, jobId, ok: true }, { status: 201 })
}
