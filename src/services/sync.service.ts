import { prisma } from '@/lib/prisma'
import { getConnector } from './connector/connector.registry'
import { customerAnalyticsService } from './customer-analytics.service'
import { segmentationService } from './segmentation.service'
import { logAuditEvent, AuditAction } from './audit.service'
import type { RawCustomer, RawAppointment, RawService } from './connector/connector.interface'
import type { ConnectorType } from '@/types/connector.types'

// ---------------------------------------------------------------------------
// Sync Service — orchestrates connector sync → import → recompute → segment refresh
// ---------------------------------------------------------------------------

export async function runConnectorSync(connectorId: string) {
  const connector = await prisma.bookingConnector.findUnique({ where: { id: connectorId } })
  if (!connector) throw new Error('Connector not found')

  // Update status to SYNCING
  await prisma.bookingConnector.update({
    where: { id: connectorId },
    data: { status: 'SYNCING' },
  })

  const run = await prisma.connectorSyncRun.create({
    data: {
      connectorId,
      tenantId: connector.tenantId,
      status: 'RUNNING',
    },
  })

  try {
    const impl = getConnector(connector.type as ConnectorType)

    // For CSV connectors this is a no-op (data already imported via UI)
    const [customerResult, appointmentResult, serviceResult] = await Promise.allSettled([
      impl.syncCustomers(connector.tenantId, connectorId),
      impl.syncAppointments(connector.tenantId, connectorId),
      impl.syncServices(connector.tenantId, connectorId),
    ])

    const errors: string[] = []
    let totalCustomers = 0
    let totalAppointments = 0

    if (customerResult.status === 'fulfilled') {
      totalCustomers = customerResult.value.stats.customersCreated + customerResult.value.stats.customersUpdated
      errors.push(...customerResult.value.errors.map((e) => e.message))
    } else {
      errors.push(`Customer sync failed: ${customerResult.reason}`)
    }

    if (appointmentResult.status === 'fulfilled') {
      totalAppointments = appointmentResult.value.stats.appointmentsCreated + appointmentResult.value.stats.appointmentsUpdated
      errors.push(...appointmentResult.value.errors.map((e) => e.message))
    } else {
      errors.push(`Appointment sync failed: ${appointmentResult.reason}`)
    }

    await prisma.connectorSyncRun.update({
      where: { id: run.id },
      data: {
        status: errors.length === 0 ? 'COMPLETED' : 'PARTIAL',
        customersCreated: totalCustomers,
        appointmentsCreated: totalAppointments,
        errors: errors as unknown as object,
        finishedAt: new Date(),
      },
    })

    await prisma.bookingConnector.update({
      where: { id: connectorId },
      data: { status: 'CONNECTED', lastSyncAt: new Date() },
    })

    // Trigger downstream recompute
    await customerAnalyticsService.recomputeAllForTenant(connector.tenantId, prisma)
    await segmentationService.refreshAllSegmentsForTenant(connector.tenantId, prisma)
  } catch (err) {
    await prisma.connectorSyncRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        errors: [{ message: (err as Error).message }] as unknown as object,
        finishedAt: new Date(),
      },
    })

    await prisma.bookingConnector.update({
      where: { id: connectorId },
      data: { status: 'ERROR' },
    })

    throw err
  }

  return run
}

/** Persist raw customers imported via CSV into the database */
export async function persistCustomers(
  tenantId: string,
  connectorId: string,
  customers: RawCustomer[],
): Promise<{ created: number; updated: number; errors: string[] }> {
  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const raw of customers) {
    try {
      const normalizedName = raw.fullName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

      const existing = await prisma.customer.findFirst({
        where: { tenantId, phoneE164: raw.phone },
      })

      if (existing) {
        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            fullName: raw.fullName,
            normalizedName,
            email: raw.email,
            birthdate: raw.birthdate ? new Date(raw.birthdate) : undefined,
            notes: raw.notes,
            tags: raw.tags ?? [],
          },
        })
        updated++
      } else {
        await prisma.customer.create({
          data: {
            tenantId,
            fullName: raw.fullName,
            normalizedName,
            phoneE164: raw.phone,
            email: raw.email,
            birthdate: raw.birthdate ? new Date(raw.birthdate) : undefined,
            notes: raw.notes,
            tags: raw.tags ?? [],
            externalId: raw.externalId,
          },
        })
        created++
      }
    } catch (err) {
      errors.push(`${raw.fullName}: ${(err as Error).message}`)
    }
  }

  return { created, updated, errors }
}

/** Persist raw appointments imported via CSV */
export async function persistAppointments(
  tenantId: string,
  connectorId: string,
  appointments: RawAppointment[],
): Promise<{ created: number; errors: string[] }> {
  let created = 0
  const errors: string[] = []

  // Build phone → customer map for this tenant
  const customerMap = new Map<string, string>() // phone → customerId
  const allCustomers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, phoneE164: true },
  })
  for (const c of allCustomers) customerMap.set(c.phoneE164, c.id)

  // Build service name → id map
  const serviceMap = new Map<string, string>()
  const allServices = await prisma.service.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true },
  })
  for (const s of allServices) serviceMap.set(s.name.toLowerCase(), s.id)

  for (const raw of appointments) {
    try {
      const customerId = customerMap.get(raw.customerPhone)
      if (!customerId) {
        errors.push(`Cliente não encontrado: ${raw.customerPhone}`)
        continue
      }

      const statusMap: Record<string, string> = {
        completed: 'COMPLETED',
        scheduled: 'SCHEDULED',
        cancelled: 'CANCELLED',
        no_show: 'NO_SHOW',
      }

      const existing = raw.externalId
        ? await prisma.appointment.findFirst({ where: { tenantId, externalId: raw.externalId } })
        : null

      if (existing) continue // Skip duplicates

      await prisma.appointment.create({
        data: {
          tenantId,
          customerId,
          connectorId,
          externalId: raw.externalId,
          serviceId: raw.serviceName ? serviceMap.get(raw.serviceName.toLowerCase()) : undefined,
          scheduledAt: new Date(raw.scheduledAt),
          completedAt: raw.completedAt ? new Date(raw.completedAt) : undefined,
          status: (statusMap[raw.status] ?? 'COMPLETED') as 'COMPLETED' | 'SCHEDULED' | 'CANCELLED' | 'NO_SHOW',
          price: raw.price,
          notes: raw.notes,
          branchName: raw.branchName,
        },
      })
      created++
    } catch (err) {
      errors.push(`Agendamento ${raw.externalId}: ${(err as Error).message}`)
    }
  }

  return { created, errors }
}

/** Persist raw services */
export async function persistServices(
  tenantId: string,
  services: RawService[],
): Promise<{ created: number; errors: string[] }> {
  let created = 0
  const errors: string[] = []

  for (const raw of services) {
    try {
      const existing = await prisma.service.findFirst({
        where: { tenantId, name: raw.name, deletedAt: null },
      })
      if (existing) continue

      await prisma.service.create({
        data: {
          tenantId,
          name: raw.name,
          category: raw.category,
          avgPrice: raw.avgPrice,
          externalId: raw.externalId,
        },
      })
      created++
    } catch (err) {
      errors.push(`Serviço ${raw.name}: ${(err as Error).message}`)
    }
  }

  return { created, errors }
}
