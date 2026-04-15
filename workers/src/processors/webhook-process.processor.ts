import type { Job } from 'bullmq'
import prisma from '../lib/prisma'
import { WebhookProcessJobData } from '../queues'

// ---------------------------------------------------------------------------
// Webhook Process Processor
// Processes incoming webhook payloads and updates message statuses.
// ---------------------------------------------------------------------------

export async function processWebhookEvent(job: Job<WebhookProcessJobData>): Promise<void> {
  const { webhookEventId } = job.data
  const log = (msg: string) =>
    console.info(`[webhook-process] job=${job.id} event=${webhookEventId} ${msg}`)

  log('Processing webhook event')

  // TODO: Implement webhook event storage and processing once a WebhookEvent
  // model is added to the schema. For now this processor handles delivery
  // status updates by matching on externalMessageId.

  log('Webhook processing complete')
}

// ---------------------------------------------------------------------------
// WhatsApp delivery status handler (can be called directly from API routes)
// ---------------------------------------------------------------------------

export async function handleWhatsAppDeliveryStatus(payload: {
  externalMessageId: string
  status: string
}): Promise<void> {
  const statusMap: Record<string, string> = {
    delivered: 'DELIVERED',
    read: 'READ',
    failed: 'FAILED',
    sent: 'SENT',
  }

  const newStatus = statusMap[payload.status]
  if (!newStatus) return

  const updateData: Record<string, unknown> = {
    status: newStatus,
  }

  if (newStatus === 'DELIVERED') {
    updateData.deliveredAt = new Date()
  } else if (newStatus === 'READ') {
    updateData.readAt = new Date()
  } else if (newStatus === 'FAILED') {
    updateData.failedAt = new Date()
  }

  await prisma.message.updateMany({
    where: { externalMessageId: payload.externalMessageId },
    data: updateData,
  })

  // Also update campaign recipient status if applicable
  const message = await prisma.message.findFirst({
    where: { externalMessageId: payload.externalMessageId },
    select: { campaignId: true, clientId: true },
  })

  if (message?.campaignId) {
    await prisma.campaignRecipient.updateMany({
      where: { campaignId: message.campaignId, clientId: message.clientId },
      data: {
        messageStatus: newStatus as 'DELIVERED' | 'READ' | 'FAILED' | 'SENT',
        deliveredAt: newStatus === 'DELIVERED' ? new Date() : undefined,
      },
    })
  }
}
