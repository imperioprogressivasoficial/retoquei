import type { Job } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import { getHours } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Message Send Processor
// Handles outbound_message jobs — validates opt-in, checks quiet hours,
// interpolates variables, sends via provider, updates status.
// ---------------------------------------------------------------------------

const QUIET_HOURS_START = 22 // 22:00
const QUIET_HOURS_END = 8   // 08:00
const BRAZIL_TZ = 'America/Sao_Paulo'
const MAX_RETRIES = 3

interface MessageSendJobData {
  messageId: string
}

// Lazy-loaded provider to avoid import issues in worker context
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

  const message = await prisma.outboundMessage.findUnique({
    where: { id: messageId },
    include: {
      customer: {
        include: { metrics: true },
      },
      template: true,
    },
  })

  if (!message) {
    console.warn(`[MessageSend] Message ${messageId} not found`)
    return
  }

  // Skip if already sent or opted out
  if (['SENT', 'DELIVERED', 'READ'].includes(message.status)) return
  if (message.status === 'OPTED_OUT') return

  // Check WhatsApp opt-in
  if (message.customer && !message.customer.whatsappOptIn) {
    await prisma.outboundMessage.update({
      where: { id: messageId },
      data: { status: 'OPTED_OUT' },
    })
    return
  }

  // Check quiet hours
  if (isQuietHours()) {
    console.log(`[MessageSend] Quiet hours — deferring message ${messageId}`)
    // Job will be retried by BullMQ; the scheduler reschedules for morning
    throw new Error('QUIET_HOURS')
  }

  // Mark as queued
  await prisma.outboundMessage.update({
    where: { id: messageId },
    data: { status: 'QUEUED' },
  })

  // Build variable context
  const customer = message.customer
  const now = new Date()
  const variables: Record<string, string> = {
    customer_name: customer?.fullName ?? '',
    first_name: customer?.fullName?.split(' ')[0] ?? '',
    salon_name: '', // TODO: load from tenant
    days_since_last_visit: String(customer?.metrics?.daysSinceLastVisit ?? ''),
    last_visit_date: customer?.metrics?.lastVisitAt
      ? customer.metrics.lastVisitAt.toLocaleDateString('pt-BR')
      : '',
    predicted_return_date: customer?.metrics?.predictedReturnDate
      ? customer.metrics.predictedReturnDate.toLocaleDateString('pt-BR')
      : '',
    preferred_service: '', // TODO: load from service name
    last_service: '', // TODO: load from last appointment
  }

  // Load tenant name for salon_name variable
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: message.tenantId }, select: { name: true } })
    if (tenant) variables.salon_name = tenant.name
  } catch {}

  // Render body
  const renderedBody = interpolateVariables(message.bodyRendered, variables)

  try {
    const provider = await getProvider()
    const result = await provider.sendTextMessage(message.toNumber, renderedBody)

    if (result.success) {
      await prisma.outboundMessage.update({
        where: { id: messageId },
        data: {
          status: 'SENT',
          providerMessageId: result.providerMessageId,
          sentAt: new Date(),
          bodyRendered: renderedBody,
        },
      })

      await prisma.messageEvent.create({
        data: {
          messageId,
          eventType: 'sent',
          payload: { providerMessageId: result.providerMessageId } as object,
        },
      })
    } else {
      const retryCount = (message.retryCount ?? 0) + 1
      const failed = retryCount >= MAX_RETRIES

      await prisma.outboundMessage.update({
        where: { id: messageId },
        data: {
          status: failed ? 'FAILED' : 'PENDING',
          error: result.error,
          retryCount,
        },
      })

      if (!failed) {
        throw new Error(`Send failed: ${result.error}`) // Trigger BullMQ retry
      }
    }
  } catch (err) {
    const msg = (err as Error).message
    if (msg === 'QUIET_HOURS') throw err // Re-throw to trigger retry

    const retryCount = (message.retryCount ?? 0) + 1
    const failed = retryCount >= MAX_RETRIES

    await prisma.outboundMessage.update({
      where: { id: messageId },
      data: {
        status: failed ? 'FAILED' : 'PENDING',
        error: msg,
        retryCount,
      },
    })

    if (!failed) throw err
  }
}
