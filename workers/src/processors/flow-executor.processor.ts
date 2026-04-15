import { Job } from 'bullmq'
import prisma from '../lib/prisma'
import { messageSendQueue, FlowExecutorJobData } from '../queues'

// ---------------------------------------------------------------------------
// Flow Executor Processor
// Evaluates automation triggers and enqueues messages for matching clients.
// ---------------------------------------------------------------------------

export async function flowExecutorProcessor(
  job: Job<FlowExecutorJobData>,
): Promise<void> {
  const { type, salonId, clientId, appointmentId, segmentId } = job.data
  const log = (msg: string) =>
    console.info(`[flow-executor] job=${job.id} salon=${salonId} type=${type} ${msg}`)

  log('Starting flow execution')

  switch (type) {
    case 'trigger_inactive':
      await handleInactiveTrigger(salonId, log)
      break
    case 'trigger_birthday':
      await handleBirthdayTrigger(salonId, log)
      break
    case 'trigger_post_service':
      if (clientId && appointmentId) {
        await handlePostServiceTrigger(salonId, clientId, appointmentId, log)
      }
      break
    case 'trigger_segment':
      if (segmentId) {
        await handleSegmentTrigger(salonId, segmentId, log)
      }
      break
    case 'execute_manual':
      if (clientId) {
        await handleManualExecution(salonId, clientId, log)
      }
      break
    default:
      log(`Unknown trigger type: ${type}`)
  }

  log('Flow execution complete')
}

// ---------------------------------------------------------------------------
// Trigger handlers
// ---------------------------------------------------------------------------

async function handleInactiveTrigger(
  salonId: string,
  log: (msg: string) => void,
): Promise<void> {
  // Find active AT_RISK and WINBACK automations for this salon
  const automations = await prisma.automation.findMany({
    where: {
      salonId,
      isActive: true,
      triggerType: { in: ['AT_RISK', 'WINBACK'] },
    },
    include: { template: true },
  })

  if (automations.length === 0) {
    log('No active inactive/winback automations found')
    return
  }

  // Find clients who are AT_RISK or LOST
  const clients = await prisma.client.findMany({
    where: {
      salonId,
      deletedAt: null,
      whatsappOptIn: true,
      lifecycleStage: { in: ['AT_RISK', 'LOST'] },
    },
    select: { id: true, lifecycleStage: true },
  })

  log(`Found ${clients.length} at-risk/lost clients`)

  let messagesCreated = 0

  for (const automation of automations) {
    if (!automation.templateId || !automation.template) continue

    const targetStage = automation.triggerType === 'AT_RISK' ? 'AT_RISK' : 'LOST'
    const matchingClients = clients.filter((c) => c.lifecycleStage === targetStage)

    for (const client of matchingClients) {
      // Check if a message was already sent recently (within 7 days) for this automation
      const recentMessage = await prisma.message.findFirst({
        where: {
          salonId,
          clientId: client.id,
          automationId: automation.id,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      })

      if (recentMessage) continue

      const message = await prisma.message.create({
        data: {
          salonId,
          clientId: client.id,
          automationId: automation.id,
          templateId: automation.templateId,
          content: automation.template.content,
          direction: 'outbound',
          status: 'PENDING',
        },
      })

      await messageSendQueue.add('send-automation-message', { messageId: message.id }, {
        jobId: `auto-msg-${message.id}`,
      })

      messagesCreated++
    }
  }

  log(`Created ${messagesCreated} automation messages`)
}

async function handleBirthdayTrigger(
  salonId: string,
  log: (msg: string) => void,
): Promise<void> {
  const automations = await prisma.automation.findMany({
    where: {
      salonId,
      isActive: true,
      triggerType: 'BIRTHDAY',
    },
    include: { template: true },
  })

  if (automations.length === 0) {
    log('No active birthday automations found')
    return
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()

  // Find clients with birthdays this month
  const clients = await prisma.client.findMany({
    where: {
      salonId,
      deletedAt: null,
      whatsappOptIn: true,
      birthDate: { not: null },
    },
    select: { id: true, birthDate: true },
  })

  const birthdayClients = clients.filter((c) => {
    if (!c.birthDate) return false
    const bd = new Date(c.birthDate)
    return bd.getMonth() + 1 === currentMonth && bd.getDate() === currentDay
  })

  log(`Found ${birthdayClients.length} clients with birthdays today`)

  let messagesCreated = 0

  for (const automation of automations) {
    if (!automation.templateId || !automation.template) continue

    for (const client of birthdayClients) {
      const recentMessage = await prisma.message.findFirst({
        where: {
          salonId,
          clientId: client.id,
          automationId: automation.id,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      })

      if (recentMessage) continue

      const message = await prisma.message.create({
        data: {
          salonId,
          clientId: client.id,
          automationId: automation.id,
          templateId: automation.templateId,
          content: automation.template.content,
          direction: 'outbound',
          status: 'PENDING',
        },
      })

      await messageSendQueue.add('send-birthday-message', { messageId: message.id }, {
        jobId: `birthday-msg-${message.id}`,
      })

      messagesCreated++
    }
  }

  log(`Created ${messagesCreated} birthday messages`)
}

async function handlePostServiceTrigger(
  salonId: string,
  clientId: string,
  appointmentId: string,
  log: (msg: string) => void,
): Promise<void> {
  const automations = await prisma.automation.findMany({
    where: {
      salonId,
      isActive: true,
      triggerType: 'POST_VISIT',
    },
    include: { template: true },
  })

  if (automations.length === 0) {
    log('No active post-visit automations found')
    return
  }

  let messagesCreated = 0

  for (const automation of automations) {
    if (!automation.templateId || !automation.template) continue

    const message = await prisma.message.create({
      data: {
        salonId,
        clientId,
        automationId: automation.id,
        templateId: automation.templateId,
        content: automation.template.content,
        direction: 'outbound',
        status: 'PENDING',
      },
    })

    await messageSendQueue.add('send-post-visit-message', { messageId: message.id }, {
      jobId: `post-visit-msg-${message.id}`,
    })

    messagesCreated++
  }

  log(`Created ${messagesCreated} post-visit messages`)
}

async function handleSegmentTrigger(
  salonId: string,
  segmentId: string,
  log: (msg: string) => void,
): Promise<void> {
  // Find automations linked to manual rule triggers
  const automations = await prisma.automation.findMany({
    where: {
      salonId,
      isActive: true,
      triggerType: 'MANUAL_RULE',
    },
    include: { template: true },
  })

  if (automations.length === 0) {
    log('No active manual-rule automations found')
    return
  }

  // Get clients in the segment
  const segmentClients = await prisma.clientSegment.findMany({
    where: { segmentId },
    select: { clientId: true },
  })

  log(`Segment ${segmentId} has ${segmentClients.length} clients`)

  let messagesCreated = 0

  for (const automation of automations) {
    if (!automation.templateId || !automation.template) continue

    for (const { clientId } of segmentClients) {
      const message = await prisma.message.create({
        data: {
          salonId,
          clientId,
          automationId: automation.id,
          templateId: automation.templateId,
          content: automation.template.content,
          direction: 'outbound',
          status: 'PENDING',
        },
      })

      await messageSendQueue.add('send-segment-message', { messageId: message.id }, {
        jobId: `segment-msg-${message.id}`,
      })

      messagesCreated++
    }
  }

  log(`Created ${messagesCreated} segment-triggered messages`)
}

async function handleManualExecution(
  salonId: string,
  clientId: string,
  log: (msg: string) => void,
): Promise<void> {
  log(`Manual execution for client ${clientId} — not yet implemented`)
}
