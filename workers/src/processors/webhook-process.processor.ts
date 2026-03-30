import type { Job } from 'bullmq'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Webhook Process Processor
// Processes queued webhook events and routes them to appropriate handlers.
// ---------------------------------------------------------------------------

interface WebhookProcessJobData {
  webhookEventId: string
}

export async function processWebhookEvent(job: Job<WebhookProcessJobData>): Promise<void> {
  const { webhookEventId } = job.data

  const event = await prisma.webhookEvent.findUnique({ where: { id: webhookEventId } })
  if (!event) {
    console.warn(`[WebhookProcess] Event ${webhookEventId} not found`)
    return
  }

  // Idempotency check
  if (event.processed) {
    console.log(`[WebhookProcess] Event ${webhookEventId} already processed, skipping`)
    return
  }

  try {
    switch (event.source) {
      case 'whatsapp':
        await handleWhatsAppEvent(event)
        break
      case 'trinks':
        await handleTrinksEvent(event)
        break
      case 'custom':
        await handleCustomWebhookEvent(event)
        break
      default:
        console.warn(`[WebhookProcess] Unknown source: ${event.source}`)
    }

    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { processed: true },
    })
  } catch (err) {
    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { error: (err as Error).message },
    })
    throw err
  }
}

async function handleWhatsAppEvent(event: { id: string; tenantId: string | null; payload: unknown }) {
  const payload = event.payload as {
    type?: string
    providerMessageId?: string
    status?: string
    fromNumber?: string
    messageBody?: string
  }

  if (payload.type === 'delivery_status' && payload.providerMessageId) {
    const statusMap: Record<string, string> = {
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
      sent: 'SENT',
    }

    const newStatus = statusMap[payload.status ?? '']
    if (newStatus) {
      await prisma.outboundMessage.updateMany({
        where: { providerMessageId: payload.providerMessageId },
        data: {
          status: newStatus as 'DELIVERED' | 'READ' | 'FAILED' | 'SENT',
          deliveredAt: newStatus === 'DELIVERED' ? new Date() : undefined,
        },
      })

      await prisma.messageEvent.create({
        data: {
          messageId: payload.providerMessageId,
          eventType: payload.status ?? 'unknown',
          payload: payload as object,
        },
      })
    }
  }

  if (payload.type === 'message' && payload.fromNumber && event.tenantId) {
    // Store inbound message
    const customer = await prisma.customer.findFirst({
      where: { tenantId: event.tenantId, phoneE164: '+' + payload.fromNumber },
    })

    await prisma.inboundMessage.create({
      data: {
        tenantId: event.tenantId,
        fromNumber: payload.fromNumber,
        customerId: customer?.id,
        body: payload.messageBody ?? '',
        channel: 'WHATSAPP',
      },
    })
  }
}

async function handleTrinksEvent(event: { id: string; tenantId: string | null; payload: unknown }) {
  // TODO: Implement Trinks webhook event handling
  // Expected events:
  // - appointment.created
  // - appointment.updated
  // - appointment.cancelled
  // - customer.created
  // - customer.updated
  console.log(`[WebhookProcess] Trinks event received (not yet implemented):`, event.eventType)
}

async function handleCustomWebhookEvent(event: { id: string; tenantId: string | null; payload: unknown }) {
  // TODO: Implement custom connector webhook handling
  // This would apply the connector's field mappings and import the data
  console.log(`[WebhookProcess] Custom webhook event received:`, JSON.stringify(event.payload).slice(0, 100))
}
