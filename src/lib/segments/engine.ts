import { prisma } from '@/lib/prisma'
import { segmentationService } from '@/services/segmentation.service'

export type RuleOp = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'is_null' | 'is_not_null'

export type SegmentRule =
  | { and: SegmentRule[] }
  | { or: SegmentRule[] }
  | { not: SegmentRule }
  | { field: string; op: RuleOp; value?: any }

export type SegmentCondition = {
  field: string
  op: RuleOp
  value?: any
}

/**
 * Compute the number of customers that match segment rules
 * Uses the existing segmentationService for consistency
 */
export async function computeSegmentMembers(
  tenantId: string,
  rules: SegmentRule
): Promise<number> {
  // Load all customers with their metrics
  const customers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    include: { metrics: true },
  })

  const currentMonth = new Date().getMonth() + 1
  let count = 0

  for (const customer of customers) {
    const projection = {
      lifecycleStage: customer.lifecycleStage,
      riskLevel: customer.riskLevel,
      daysSinceLastVisit: customer.metrics?.daysSinceLastVisit ?? null,
      avgDaysBetweenVisits: customer.metrics?.avgDaysBetweenVisits ?? null,
      totalAppointments: customer.metrics?.totalAppointments ?? 0,
      totalSpent: customer.metrics?.totalSpent ?? 0,
      avgTicket: customer.metrics?.avgTicket ?? 0,
      ltv: customer.metrics?.ltv ?? 0,
      repeatVisitRate: customer.metrics?.repeatVisitRate ?? 0,
      rfmScore: customer.metrics?.rfmScore ?? 0,
      birthdateMonth: customer.birthdate ? customer.birthdate.getMonth() + 1 : null,
      tags: customer.tags ?? [],
    }

    if (segmentationService.evaluateRules(projection as any, rules)) {
      count++
    }
  }

  return count
}

/**
 * Get customer IDs that match segment rules
 */
export async function getSegmentCustomerIds(
  tenantId: string,
  rules: SegmentRule
): Promise<string[]> {
  // Load all customers with their metrics
  const customers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    include: { metrics: true },
  })

  const currentMonth = new Date().getMonth() + 1
  const qualifying: string[] = []

  for (const customer of customers) {
    const projection = {
      lifecycleStage: customer.lifecycleStage,
      riskLevel: customer.riskLevel,
      daysSinceLastVisit: customer.metrics?.daysSinceLastVisit ?? null,
      avgDaysBetweenVisits: customer.metrics?.avgDaysBetweenVisits ?? null,
      totalAppointments: customer.metrics?.totalAppointments ?? 0,
      totalSpent: customer.metrics?.totalSpent ?? 0,
      avgTicket: customer.metrics?.avgTicket ?? 0,
      ltv: customer.metrics?.ltv ?? 0,
      repeatVisitRate: customer.metrics?.repeatVisitRate ?? 0,
      rfmScore: customer.metrics?.rfmScore ?? 0,
      birthdateMonth: customer.birthdate ? customer.birthdate.getMonth() + 1 : null,
      tags: customer.tags ?? [],
    }

    if (segmentationService.evaluateRules(projection as any, rules)) {
      qualifying.push(customer.id)
    }
  }

  return qualifying
}

/**
 * Update segment memberships based on rules
 */
export async function updateSegmentMemberships(
  tenantId: string,
  segmentId: string,
  rules: SegmentRule
): Promise<number> {
  const customerIds = await getSegmentCustomerIds(tenantId, rules)

  // Delete old memberships
  await prisma.segmentMembership.deleteMany({
    where: { segmentId, tenantId },
  })

  // Create new memberships
  if (customerIds.length > 0) {
    await prisma.segmentMembership.createMany({
      data: customerIds.map((customerId) => ({
        segmentId,
        customerId,
        tenantId,
      })),
      skipDuplicates: true,
    })
  }

  return customerIds.length
}


/**
 * Pre-defined segment type rules
 * Using same rule format as segmentationService for consistency
 */
export const SEGMENT_TYPE_RULES: Record<string, SegmentRule> = {
  AT_RISK: {
    and: [
      { field: 'daysSinceLastVisit', op: 'gt', value: 45 },
      { field: 'daysSinceLastVisit', op: 'lte', value: 120 },
    ],
  } as any,
  ACTIVE: {
    and: [{ field: 'daysSinceLastVisit', op: 'lte', value: 30 }],
  } as any,
  VIP: {
    and: [{ field: 'totalSpent', op: 'gte', value: 2000 }],
  } as any,
  NEW: {
    field: 'lifecycleStage',
    op: 'eq',
    value: 'NEW',
  } as any,
  LOST: {
    field: 'daysSinceLastVisit',
    op: 'gt',
    value: 120,
  } as any,
}

/**
 * Create system segments (delegates to existing segmentationService)
 */
export async function createSystemSegments(tenantId: string): Promise<void> {
  await segmentationService.seedSystemSegments(tenantId, prisma)
}

/**
 * Recompute all segments for a tenant
 */
export async function recomputeTenantSegments(tenantId: string): Promise<void> {
  await segmentationService.refreshAllSegmentsForTenant(tenantId, prisma)
}
