import { Job } from 'bullmq'
import prisma from '../lib/prisma'
import {
  customerRecomputeQueue,
  ConnectorSyncJobData,
  CustomerRecomputeJobData,
} from '../queues'

// ---------------------------------------------------------------------------
// Types mirroring what external APIs return (simplified)
// ---------------------------------------------------------------------------

interface ExternalAppointment {
  id: string
  clientName: string
  clientPhone: string
  serviceName: string
  professionalName: string | null
  scheduledAt: string
  status: string
  price: number | null
}

interface SyncResult {
  clientsCreated: number
  clientsUpdated: number
  appointmentsCreated: number
  appointmentsUpdated: number
  errors: string[]
}

// ---------------------------------------------------------------------------
// Helper: normalize Brazilian phone number
// ---------------------------------------------------------------------------

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`
  }
  if (digits.length === 11 || digits.length === 10) {
    return `+55${digits}`
  }
  return `+55${digits}`
}

// ---------------------------------------------------------------------------
// Main processor
// ---------------------------------------------------------------------------

export async function connectorSyncProcessor(
  job: Job<ConnectorSyncJobData>,
): Promise<void> {
  const { salonId, connectorId, syncType } = job.data
  const log = (msg: string) =>
    console.info(`[connector-sync] job=${job.id} connector=${connectorId} ${msg}`)

  log(`Starting ${syncType} sync`)

  const result: SyncResult = {
    clientsCreated: 0,
    clientsUpdated: 0,
    appointmentsCreated: 0,
    appointmentsUpdated: 0,
    errors: [],
  }

  try {
    const integration = await prisma.integration.findUniqueOrThrow({
      where: { id: connectorId },
    })

    await prisma.integration.update({
      where: { id: connectorId },
      data: { status: 'CONNECTED' },
    })

    const config = (integration.configJson as Record<string, unknown>) ?? {}

    // TODO: Implement per-type sync logic (CSV, WEBHOOK, API, etc.)
    // For now, just mark the integration as synced
    log(`Integration type=${integration.type} — sync logic pending implementation`)

    await prisma.integration.update({
      where: { id: connectorId },
      data: {
        status: 'CONNECTED',
        lastSyncAt: new Date(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    result.errors.push(message)

    await prisma.integration.update({
      where: { id: connectorId },
      data: { status: 'ERROR' },
    })

    log(`Failed: ${message}`)
    throw err // BullMQ will handle retries
  }

  log(
    `Completed — +${result.clientsCreated} clients, +${result.appointmentsCreated} appointments, ${result.errors.length} errors`,
  )

  // Enqueue client recompute for this salon
  const recomputePayload: CustomerRecomputeJobData = { salonId }
  await customerRecomputeQueue.add('recompute-after-sync', recomputePayload, {
    jobId: `recompute-${salonId}-${Date.now()}`,
  })
}
