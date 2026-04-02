import type { Job } from 'bullmq'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Flow Executor Processor
// Evaluates triggers and executes flows for customers
// ---------------------------------------------------------------------------

interface FlowExecutorJobData {
  type: 'trigger_inactive' | 'trigger_birthday' | 'trigger_segment' | 'trigger_post_service' | 'execute_manual'
  tenantId: string
  customerId?: string
  appointmentId?: string
  segmentId?: string
}

/**
 * Imports the flow engine dynamically to avoid circular dependencies
 */
async function getFlowEngine() {
  const module = await import('../../../src/lib/flows/engine')
  return module
}

/**
 * Processes flow triggers and executions
 */
export async function processFlowExecutor(job: Job<FlowExecutorJobData>): Promise<void> {
  const { type, tenantId, customerId, appointmentId, segmentId } = job.data
  const engine = await getFlowEngine()

  console.log(`[FlowExecutor] Processing ${type} for tenant ${tenantId}`)

  try {
    switch (type) {
      case 'trigger_inactive':
        await engine.triggerInactiveFlows(tenantId)
        break

      case 'trigger_birthday':
        await engine.triggerBirthdayFlows(tenantId)
        break

      case 'trigger_segment': {
        if (!customerId || !segmentId) {
          throw new Error('trigger_segment requires customerId and segmentId')
        }
        await engine.triggerSegmentFlows(tenantId, customerId, segmentId)
        break
      }

      case 'trigger_post_service': {
        if (!customerId || !appointmentId) {
          throw new Error('trigger_post_service requires customerId and appointmentId')
        }
        await engine.triggerPostServiceFlows(tenantId, customerId, appointmentId)
        break
      }

      case 'execute_manual': {
        if (!customerId) {
          throw new Error('execute_manual requires customerId')
        }
        // Find and execute manually triggered flows
        const flows = await engine.getActiveFlowsByTrigger(tenantId, 'MANUAL')
        for (const flow of flows) {
          await engine.executeFlow(customerId, flow)
        }
        break
      }

      default:
        throw new Error(`Unknown flow executor type: ${type}`)
    }

    console.log(`[FlowExecutor] Completed ${type} for tenant ${tenantId}`)
  } catch (err) {
    console.error(`[FlowExecutor] Error processing ${type}:`, err)
    throw err
  }
}
