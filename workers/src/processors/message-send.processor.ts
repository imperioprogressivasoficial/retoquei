import type { Job } from 'bullmq'
import { getHours } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import prisma from '../lib/prisma'

const QUIET_HOURS_START = 22
const QUIET_HOURS_END = 8
const BRAZIL_TZ = 'America/Sao_Paulo'
const MAX_RETRIES = 3

interface MessageSendJobData {
  messageId: string
}

let _provider: { sendTextMessage: (to: string, body: string) => Promise<{ success: boolean; providerMessageId?: string; error?: string }> } | null = null

async function getProvider() {
  if (_provider) return _provider

  const isMock = process.env.WHATSAPP_MOCK_MODE === 'true' || !process.env.WHATSAPP_ACCESS_TOKEN

  if (isMock) {
    const { MockMessagingProvider } = await import('../../../src/services/messaging/mock.provider')
    _provider = new MockMessagingProvider()
  } else {
    const { WhatsAppCloudProvider } = await import('../../../src/services/messaging/whatsapp-cloud.provider')
    _provider = new WhatsAppCloudProvider()
  }
  return _provider
}

function isQuietHours(): boolean {
  const now = toZonedTime(new Date(), BRAZIL_TZ)
  const hour = getHours(now)
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END
}

function interpolateVariables(body: string, vars: Record<string, string>): string {
  let result = body
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, val)
  }
  return result
}

export async function processMessageSend(job: Job<MessageSendJobData>): Promise<void> {
  const { messageId } = job.data

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      client: true,
      salon: true,
      template: true,
    },
  })

  if (!message) {
    console.warn(`[MessageSend] Message ${messageId} not found`)
    return
  }

  // Skip if already processed
  if (['SENT', 'DELIVERED', 'READ'].includes(message.status)) return

  // Check WhatsApp opt-in
  if (message.client && !message.client.whatsappOptIn) {
    await prisma.message.update({
      where: { id: messageId },
      data: { status: 'FAILED', failedAt: new Date() },
    })
    return
  }

  // Check quiet hours
  if (isQuietHours()) {
    console.log(`[MessageSend] Quiet hours — deferring message ${messageId}`)
    throw new Error('QUIET_HOURS')
  }

  // Mark as queued
  await prisma.message.update({
    where: { id: messageId },
    data: { status: 'QUEUED' },
  })

  // Build variable context
  const client = message.client
  const salon = message.salon
  const variables: Record<string, string> = {
    nome: client?.fullName?.split(' ')[0] ?? 'cliente',
    name: client?.fullName?.split(' ')[0] ?? 'cliente',
    fullName: client?.fullName ?? 'cliente',
    first_name: client?.fullName?.split(' ')[0] ?? 'cliente',
    customer_name: client?.fullName ?? 'cliente',
    salon_name: salon?.name ?? '',
  }

  // Render body
  const renderedBody = interpolateVariables(message.content, variables)

  const attemptNumber = (job.attemptsMade ?? 0) + 1

  try {
    const provider = await getProvider()
    const result = await provider.sendTextMessage(client.phone, renderedBody)

    if (result.success) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'SENT',
          externalMessageId: result.providerMessageId ?? null,
          sentAt: new Date(),
          content: renderedBody,
        },
      })

      // Also update campaign recipient if this is a campaign message
      if (message.campaignId) {
        await prisma.campaignRecipient.updateMany({
          where: { campaignId: message.campaignId, clientId: message.clientId },
          data: { messageStatus: 'SENT', sentAt: new Date() },
        })
      }
    } else {
      const failed = attemptNumber >= MAX_RETRIES
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: failed ? 'FAILED' : 'PENDING',
          failedAt: failed ? new Date() : null,
        },
      })

      if (!failed) {
        throw new Error(`Send failed: ${result.error}`)
      }
    }
  } catch (err) {
    const msg = (err as Error).message
    if (msg === 'QUIET_HOURS') throw err

    const failed = attemptNumber >= MAX_RETRIES
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: failed ? 'FAILED' : 'PENDING',
        failedAt: failed ? new Date() : null,
      },
    })

    if (message.campaignId && failed) {
      await prisma.campaignRecipient.updateMany({
        where: { campaignId: message.campaignId, clientId: message.clientId },
        data: { messageStatus: 'FAILED' },
      })
    }

    if (!failed) throw err
  }
}
