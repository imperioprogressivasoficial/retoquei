import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const connector = await prisma.bookingConnector.findFirst({
    where: { id: params.id, tenantId },
  })
  if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 })

  // For CSV connectors, re-sync means refreshing analytics/segments
  await prisma.bookingConnector.update({
    where: { id: params.id },
    data: { status: 'SYNCING', lastSyncAt: new Date() },
  })

  // Create sync run record
  const syncRun = await prisma.connectorSyncRun.create({
    data: {
      connectorId: connector.id,
      tenantId,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  })

  // Fire-and-forget: recompute analytics
  const { customerAnalyticsService } = await import('@/services/customer-analytics.service')
  const { segmentationService } = await import('@/services/segmentation.service')

  customerAnalyticsService.recomputeAllForTenant(tenantId, prisma)
    .then(() => segmentationService.refreshAllSegmentsForTenant(tenantId, prisma))
    .then(async () => {
      const count = await prisma.customer.count({ where: { tenantId, deletedAt: null } })
      await prisma.connectorSyncRun.update({
        where: { id: syncRun.id },
        data: { status: 'COMPLETED', finishedAt: new Date(), customersUpdated: count },
      })
      await prisma.bookingConnector.update({
        where: { id: params.id },
        data: { status: 'CONNECTED', lastSyncAt: new Date() },
      })
    })
    .catch(async (err) => {
      console.error('[Sync] Error:', err)
      await prisma.connectorSyncRun.update({
        where: { id: syncRun.id },
        data: { status: 'FAILED', finishedAt: new Date(), errors: [err.message] as any },
      })
      await prisma.bookingConnector.update({
        where: { id: params.id },
        data: { status: 'ERROR' },
      })
    })

  return NextResponse.json({ ok: true, syncRunId: syncRun.id })
}
