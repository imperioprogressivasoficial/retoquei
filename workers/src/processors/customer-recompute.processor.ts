import { Job } from 'bullmq'
import { differenceInDays, addDays } from 'date-fns'
import prisma from '../lib/prisma'
import {
  segmentRefreshQueue,
  CustomerRecomputeJobData,
  SegmentRefreshJobData,
} from '../queues'
import { LifecycleStage, AppointmentStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Lifecycle stage determination
// ---------------------------------------------------------------------------

const AT_RISK_THRESHOLD_DAYS = 90
const LOST_THRESHOLD_DAYS = 180
const VIP_APPOINTMENT_COUNT = 10

function determineLifecycleStage(
  totalAppts: number,
  daysSinceLastVisit: number,
): LifecycleStage {
  if (totalAppts === 0) return 'NEW'
  if (daysSinceLastVisit >= LOST_THRESHOLD_DAYS) return 'LOST'
  if (daysSinceLastVisit >= AT_RISK_THRESHOLD_DAYS) return 'AT_RISK'
  if (totalAppts >= VIP_APPOINTMENT_COUNT) return 'VIP'
  if (totalAppts >= 3) return 'RECURRING'
  return 'NEW'
}

// ---------------------------------------------------------------------------
// Per-client recompute
// ---------------------------------------------------------------------------

async function recomputeClient(clientId: string, salonId: string): Promise<void> {
  const appointments = await prisma.appointment.findMany({
    where: {
      clientId,
      salonId,
      status: AppointmentStatus.COMPLETED,
    },
    orderBy: { appointmentDate: 'asc' },
  })

  const now = new Date()
  const totalAppointments = appointments.length

  if (totalAppointments === 0) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        visitCount: 0,
        totalSpent: 0,
        averageTicket: 0,
        ltv: 0,
        averageIntervalDays: 0,
        firstVisitAt: null,
        lastVisitAt: null,
        lifecycleStage: 'NEW',
      },
    })
    return
  }

  const totalSpent = appointments.reduce(
    (sum, a) => sum + Number(a.amount ?? 0),
    0,
  )
  const averageTicket = totalSpent / totalAppointments
  const firstVisitAt = appointments[0].appointmentDate
  const lastVisitAt = appointments[totalAppointments - 1].appointmentDate
  const daysSinceLastVisit = differenceInDays(now, lastVisitAt)

  let averageIntervalDays = 0
  if (totalAppointments >= 2) {
    const totalDays = differenceInDays(lastVisitAt, firstVisitAt)
    averageIntervalDays = Math.round(totalDays / (totalAppointments - 1))
  }

  // Simple LTV: average ticket x projected yearly visits
  const projectedYearlyVisits =
    averageIntervalDays > 0 ? 365 / averageIntervalDays : 1
  const ltv = parseFloat((averageTicket * projectedYearlyVisits).toFixed(2))

  const lifecycleStage = determineLifecycleStage(totalAppointments, daysSinceLastVisit)

  await prisma.client.update({
    where: { id: clientId },
    data: {
      visitCount: totalAppointments,
      totalSpent,
      averageTicket,
      ltv,
      averageIntervalDays,
      firstVisitAt,
      lastVisitAt,
      lifecycleStage,
    },
  })
}

// ---------------------------------------------------------------------------
// Main processor
// ---------------------------------------------------------------------------

export async function customerRecomputeProcessor(
  job: Job<CustomerRecomputeJobData>,
): Promise<void> {
  const { salonId, clientId } = job.data
  const log = (msg: string) =>
    console.info(`[customer-recompute] job=${job.id} salon=${salonId} ${msg}`)

  log(clientId ? `Recomputing client ${clientId}` : 'Recomputing all clients')

  if (clientId) {
    await recomputeClient(clientId, salonId)
    log(`Recomputed client ${clientId}`)
  } else {
    const clients = await prisma.client.findMany({
      where: { salonId, deletedAt: null },
      select: { id: true },
    })

    let processed = 0
    let errors = 0

    for (const client of clients) {
      try {
        await recomputeClient(client.id, salonId)
        processed++
      } catch (err) {
        errors++
        const message = err instanceof Error ? err.message : String(err)
        console.error(
          `[customer-recompute] Failed to recompute client ${client.id}: ${message}`,
        )
      }

      if (processed % 100 === 0) {
        await job.updateProgress(Math.round((processed / clients.length) * 100))
      }
    }

    log(`Recomputed ${processed} clients (${errors} errors)`)
  }

  // Enqueue segment refresh for this salon
  const segmentPayload: SegmentRefreshJobData = { salonId }
  await segmentRefreshQueue.add('refresh-after-recompute', segmentPayload, {
    jobId: `segment-refresh-${salonId}-${Date.now()}`,
  })

  log('Enqueued segment-refresh')
}
