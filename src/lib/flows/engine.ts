import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// This will be set by the worker
let messageSendQueue: any = null

export function setMessageSendQueue(queue: any) {
  messageSendQueue = queue
}

// ---------------------------------------------------------------------------
// Flow Execution Engine
// Handles triggers, evaluates conditions, and executes flow steps
// ---------------------------------------------------------------------------

export type TriggerType = 'AFTER_APPOINTMENT' | 'SEGMENT_ENTER' | 'BIRTHDAY_MONTH' | 'DAYS_INACTIVE' | 'MANUAL'
export type StepType = 'DELAY' | 'SEND_MESSAGE' | 'CONDITION' | 'UPDATE_CUSTOMER'

interface FlowStep {
  id: string
  flowId: string
  stepOrder: number
  type: StepType
  config: Record<string, unknown>
  createdAt: Date
}

interface Flow {
  id: string
  tenantId: string
  name: string
  description: string | null
  triggerType: TriggerType
  triggerConfig: Record<string, unknown>
  isActive: boolean
  runsCount: number
  steps: FlowStep[]
}

interface ExecutionContext {
  customerId: string
  tenantId: string
  flowId: string
  triggerData?: Record<string, unknown>
  variables: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Trigger Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluates if a flow should trigger for a customer
 */
export async function evaluateTrigger(
  customer: any,
  flow: Flow,
  triggerData?: Record<string, unknown>,
): Promise<boolean> {
  switch (flow.triggerType) {
    case 'DAYS_INACTIVE': {
      const days = (flow.triggerConfig?.days as number) ?? 30
      const lastVisit = customer.metrics?.lastVisitAt
      if (!lastVisit) return false
      const daysSince = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      return daysSince >= days
    }

    case 'AFTER_APPOINTMENT':
      // Trigger data contains appointmentId
      return !!triggerData?.appointmentId

    case 'BIRTHDAY_MONTH': {
      if (!customer.birthDate) return false
      const now = new Date()
      const birth = new Date(customer.birthDate)
      return birth.getMonth() === now.getMonth()
    }

    case 'SEGMENT_ENTER':
      // Trigger data contains segmentId
      return !!triggerData?.segmentId

    case 'MANUAL':
      // Always false for automatic evaluation; only triggered by explicit API call
      return false

    default:
      return false
  }
}

/**
 * Evaluates a condition step to determine if execution should continue
 */
export function evaluateCondition(config: Record<string, unknown>, customer: any): boolean {
  const field = config.field as string
  const operator = config.operator as string
  const value = config.value

  let fieldValue: unknown

  switch (field) {
    case 'lifecycle':
      fieldValue = customer.lifecycleStage
      break
    case 'risk':
      fieldValue = customer.riskLevel
      break
    case 'days_since_visit':
      if (customer.metrics?.lastVisitAt) {
        fieldValue = Math.floor((Date.now() - customer.metrics.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24))
      }
      break
    default:
      return false
  }

  switch (operator) {
    case 'equals':
      return fieldValue === value
    case 'gt':
      return (fieldValue as number) > (value as number)
    case 'lt':
      return (fieldValue as number) < (value as number)
    default:
      return false
  }
}

/**
 * Sleeps for the specified delay
 */
async function sleepDelay(config: Record<string, unknown>): Promise<void> {
  const value = (config.value as number) ?? 1
  const unit = (config.unit as string) ?? 'days'

  const ms = unit === 'hours' ? value * 60 * 60 * 1000 : value * 24 * 60 * 60 * 1000

  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Sends a message via the message queue
 */
export async function executeMessageStep(
  ctx: ExecutionContext,
  config: Record<string, unknown>,
): Promise<void> {
  const templateId = config.templateId as string
  const channel = (config.channel as string) ?? 'WHATSAPP'

  if (!templateId) {
    console.warn(`[FlowEngine] No template specified for message step in flow ${ctx.flowId}`)
    return
  }

  const customer = await prisma.customer.findUnique({
    where: { id: ctx.customerId },
  })

  if (!customer) {
    console.warn(`[FlowEngine] Customer ${ctx.customerId} not found`)
    return
  }

  const template = await prisma.messageTemplate.findUnique({
    where: { id: templateId },
  })

  if (!template) {
    console.warn(`[FlowEngine] Template ${templateId} not found`)
    return
  }

  // Create outbound message
  const message = await prisma.outboundMessage.create({
    data: {
      tenantId: ctx.tenantId,
      customerId: ctx.customerId,
      templateId,
      flowId: ctx.flowId,
      channel: channel as any,
      toNumber: customer.whatsappPhone || customer.phone || '',
      bodyRendered: template.body,
      status: 'PENDING',
    },
  })

  // Queue for sending
  if (messageSendQueue) {
    await messageSendQueue.add('send', { messageId: message.id })
  } else {
    console.warn(`[FlowEngine] Message queue not initialized, cannot queue message ${message.id}`)
  }
}

/**
 * Updates customer data
 */
export async function executeUpdateCustomerStep(
  ctx: ExecutionContext,
  config: Record<string, unknown>,
): Promise<void> {
  const field = config.field as string
  const value = config.value

  if (field === 'whatsappOptIn') {
    await prisma.customer.update({
      where: { id: ctx.customerId },
      data: { whatsappOptIn: value as boolean },
    })
  }
}

/**
 * Executes a single flow step
 */
export async function executeStep(ctx: ExecutionContext, step: FlowStep): Promise<boolean> {
  try {
    switch (step.type) {
      case 'DELAY':
        await sleepDelay(step.config)
        return true

      case 'SEND_MESSAGE':
        await executeMessageStep(ctx, step.config)
        return true

      case 'CONDITION': {
        const customer = await prisma.customer.findUnique({
          where: { id: ctx.customerId },
          include: { metrics: true },
        })
        if (!customer) return false
        return evaluateCondition(step.config, customer)
      }

      case 'UPDATE_CUSTOMER':
        await executeUpdateCustomerStep(ctx, step.config)
        return true

      default:
        return false
    }
  } catch (err) {
    console.error(`[FlowEngine] Error executing step ${step.id}:`, err)
    return false
  }
}

/**
 * Executes an entire flow for a customer
 */
export async function executeFlow(
  customerId: string,
  flow: Flow,
  triggerData?: Record<string, unknown>,
): Promise<void> {
  console.log(`[FlowEngine] Executing flow ${flow.id} (${flow.name}) for customer ${customerId}`)

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { metrics: true },
  })

  if (!customer) {
    console.warn(`[FlowEngine] Customer ${customerId} not found`)
    return
  }

  // Evaluate trigger
  const shouldTrigger = await evaluateTrigger(customer, flow, triggerData)
  if (!shouldTrigger) {
    console.log(`[FlowEngine] Flow ${flow.id} trigger not met for customer ${customerId}`)
    return
  }

  const ctx: ExecutionContext = {
    customerId,
    tenantId: flow.tenantId,
    flowId: flow.id,
    triggerData,
    variables: {},
  }

  // Execute steps sequentially
  let continueExecution = true
  for (const step of flow.steps) {
    if (!continueExecution) break

    // For CONDITION steps, don't continue if condition fails
    if (step.type === 'CONDITION') {
      continueExecution = await executeStep(ctx, step)
    } else {
      await executeStep(ctx, step)
    }
  }

  // Increment run count
  await prisma.automationFlow.update({
    where: { id: flow.id },
    data: { runsCount: { increment: 1 } },
  })

  console.log(`[FlowEngine] Flow ${flow.id} completed for customer ${customerId}`)
}

/**
 * Gets all active flows of a specific trigger type
 */
export async function getActiveFlowsByTrigger(
  tenantId: string,
  triggerType: TriggerType,
): Promise<Flow[]> {
  return prisma.automationFlow.findMany({
    where: {
      tenantId,
      triggerType,
      isActive: true,
    },
    include: {
      steps: {
        orderBy: { stepOrder: 'asc' },
      },
    },
  })
}

/**
 * Triggers DAYS_INACTIVE flows for all customers who need them
 */
export async function triggerInactiveFlows(tenantId: string): Promise<void> {
  console.log(`[FlowEngine] Checking DAYS_INACTIVE flows for tenant ${tenantId}`)

  const flows = await getActiveFlowsByTrigger(tenantId, 'DAYS_INACTIVE')
  if (flows.length === 0) return

  // Get all customers with metrics
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    include: { metrics: true },
  })

  for (const flow of flows) {
    for (const customer of customers) {
      try {
        await executeFlow(customer.id, flow)
      } catch (err) {
        console.error(`[FlowEngine] Error executing flow ${flow.id} for customer ${customer.id}:`, err)
      }
    }
  }
}

/**
 * Triggers AFTER_APPOINTMENT flows
 */
export async function triggerPostServiceFlows(
  tenantId: string,
  customerId: string,
  appointmentId: string,
): Promise<void> {
  console.log(`[FlowEngine] Checking POST_SERVICE flows for customer ${customerId}`)

  const flows = await getActiveFlowsByTrigger(tenantId, 'AFTER_APPOINTMENT')
  if (flows.length === 0) return

  for (const flow of flows) {
    try {
      await executeFlow(customerId, flow, { appointmentId })
    } catch (err) {
      console.error(`[FlowEngine] Error executing flow ${flow.id} for customer ${customerId}:`, err)
    }
  }
}

/**
 * Triggers flows when a customer enters a segment
 */
export async function triggerSegmentFlows(
  tenantId: string,
  customerId: string,
  segmentId: string,
): Promise<void> {
  console.log(`[FlowEngine] Checking SEGMENT_ENTER flows for customer ${customerId} in segment ${segmentId}`)

  const flows = await getActiveFlowsByTrigger(tenantId, 'SEGMENT_ENTER')
  if (flows.length === 0) return

  for (const flow of flows) {
    try {
      await executeFlow(customerId, flow, { segmentId })
    } catch (err) {
      console.error(`[FlowEngine] Error executing flow ${flow.id} for customer ${customerId}:`, err)
    }
  }
}

/**
 * Triggers BIRTHDAY_MONTH flows for all eligible customers
 */
export async function triggerBirthdayFlows(tenantId: string): Promise<void> {
  console.log(`[FlowEngine] Checking BIRTHDAY_MONTH flows for tenant ${tenantId}`)

  const flows = await getActiveFlowsByTrigger(tenantId, 'BIRTHDAY_MONTH')
  if (flows.length === 0) return

  // Get all customers with birthdays this month
  const now = new Date()
  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      birthDate: {
        not: null,
      },
    },
  })

  const birthdayCustomers = customers.filter((c) => {
    if (!c.birthDate) return false
    const birth = new Date(c.birthDate)
    return birth.getMonth() === now.getMonth()
  })

  for (const flow of flows) {
    for (const customer of birthdayCustomers) {
      try {
        await executeFlow(customer.id, flow)
      } catch (err) {
        console.error(`[FlowEngine] Error executing flow ${flow.id} for customer ${customer.id}:`, err)
      }
    }
  }
}
