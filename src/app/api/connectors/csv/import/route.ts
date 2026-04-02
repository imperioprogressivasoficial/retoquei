import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { CSVConnector } from '@/services/connector/csv.connector'
import { persistCustomers, persistAppointments, persistServices } from '@/services/sync.service'
import { customerAnalyticsService } from '@/services/customer-analytics.service'
import { segmentationService } from '@/services/segmentation.service'
import { logAuditEvent, AuditAction } from '@/services/audit.service'
import { z } from 'zod'
import type { ColumnMappingTarget } from '@/types/connector.types'

export const dynamic = 'force-dynamic'

const BUCKET = 'csv-imports'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin credentials not configured')
  return createAdmin(url, key, { auth: { persistSession: false } })
}

const VALID_COLUMN_TARGETS = z.enum([
  // Customer fields
  'customer.name',
  'customer.phone',
  'customer.email',
  'customer.birthdate',
  'customer.notes',
  'customer.externalId',
  'customer.tags',
  // Appointment fields
  'appointment.customerId',
  'appointment.customerPhone',
  'appointment.customerName',
  'appointment.date',
  'appointment.time',
  'appointment.datetime',
  'appointment.serviceName',
  'appointment.servicePrice',
  'appointment.totalValue',
  'appointment.status',
  'appointment.notes',
  'appointment.externalId',
  // Service fields
  'service.name',
  'service.category',
  'service.price',
  'service.duration',
  'service.externalId',
])

const schema = z.object({
  connectorId: z.string(),
  importType: z.enum(['customers', 'appointments', 'services']),
  rows: z.array(z.record(z.string())),
  columnMappings: z.array(z.object({
    targetField: VALID_COLUMN_TARGETS,
    csvColumn: z.string(),
    required: z.boolean().optional(),
  })),
  storagePath: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { connectorId, importType, rows, columnMappings, storagePath } = result.data

  // Verify connector belongs to tenant
  const connector = await prisma.bookingConnector.findFirst({
    where: { id: connectorId, tenantId },
  })
  if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 })

  const csvConnector = new CSVConnector()

  let importResult: { created: number; updated: number; errors: string[] }

  try {
    if (importType === 'customers') {
      const { customers, errors } = csvConnector.parseCustomers(rows, columnMappings as never)
      const deduplicated = csvConnector.deduplicateCustomers(customers)
      const persist = await persistCustomers(tenantId, connectorId, deduplicated)
      importResult = {
        created: persist.created,
        updated: persist.updated,
        errors: [...errors.map((e) => `Linha ${e.row}: ${e.message}`), ...persist.errors],
      }
    } else if (importType === 'appointments') {
      const { appointments, errors } = csvConnector.parseAppointments(rows, columnMappings as never)
      const persist = await persistAppointments(tenantId, connectorId, appointments)
      importResult = {
        created: persist.created,
        updated: 0,
        errors: [...errors.map((e) => `Linha ${e.row}: ${e.message}`), ...persist.errors],
      }
    } else {
      const { services, errors } = csvConnector.parseServices(rows, columnMappings as never)
      const persist = await persistServices(tenantId, services)
      importResult = {
        created: persist.created,
        updated: 0,
        errors: [...errors.map((e) => `Linha ${e.row}: ${e.message}`), ...persist.errors],
      }
    }
  } catch (err) {
    console.error('[csv/import] Processing error:', err)
    return NextResponse.json({ error: 'Erro ao processar os dados. Verifique o mapeamento de colunas.' }, { status: 500 })
  }

  // Update connector last sync
  await prisma.bookingConnector.update({
    where: { id: connectorId },
    data: { lastSyncAt: new Date(), status: 'CONNECTED' },
  }).catch(() => {})

  // Delete file from Storage after successful import (fire and forget)
  if (storagePath) {
    const admin = getAdminClient()
    admin.storage.from(BUCKET).remove([storagePath]).catch((err) => {
      console.warn('[csv/import] Could not delete storage file:', err)
    })
  }

  // Trigger async recompute (fire and forget)
  customerAnalyticsService.recomputeAllForTenant(tenantId, prisma)
    .then(() => segmentationService.refreshAllSegmentsForTenant(tenantId, prisma))
    .catch((err) => console.error('[Import] Recompute error:', err))

  // Audit log (fire and forget — don't let this block the response)
  logAuditEvent({
    tenantId,
    userId: dbUser.id,
    action: AuditAction.CUSTOMER_IMPORTED,
    resourceType: 'connector',
    resourceId: connectorId,
    diff: { importType, created: importResult.created, errors: importResult.errors.length },
    req,
  }).catch(() => {})

  return NextResponse.json(importResult)
}
