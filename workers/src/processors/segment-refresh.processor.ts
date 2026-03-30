import { Job } from 'bullmq';
import { prisma } from '../lib/prisma';
import { SegmentRefreshJobData } from '../queues';
import { CustomerMetrics, Customer, LifecycleStage, RiskLevel } from '@prisma/client';

// ---------------------------------------------------------------------------
// Segment rule evaluation engine
// ---------------------------------------------------------------------------

type RuleOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'contains'
  | 'between';

type RuleLogic = 'AND' | 'OR';

interface SegmentRule {
  field: string;
  operator: RuleOperator;
  value?: unknown;
}

interface SegmentRulesJson {
  logic?: RuleLogic;
  rules: SegmentRule[];
}

type CustomerWithMetrics = Customer & {
  metrics: CustomerMetrics | null;
};

/**
 * Resolve a dot-notation field path from a customer + metrics object.
 */
function resolveField(customer: CustomerWithMetrics, field: string): unknown {
  // Top-level customer fields
  const customerFieldMap: Record<string, unknown> = {
    lifecycleStage: customer.lifecycleStage,
    riskLevel: customer.riskLevel,
    whatsappOptIn: customer.whatsappOptIn,
    tags: customer.tags,
    createdAt: customer.createdAt,
    birthdate: customer.birthdate,
    phoneE164: customer.phoneE164,
    email: customer.email,
  };

  if (field in customerFieldMap) {
    return customerFieldMap[field];
  }

  // Metric fields
  const m = customer.metrics;
  if (!m) return null;

  const metricFieldMap: Record<string, unknown> = {
    'metrics.totalAppointments': m.totalAppointments,
    'metrics.totalSpent': m.totalSpent,
    'metrics.avgTicket': m.avgTicket,
    'metrics.daysSinceLastVisit': m.daysSinceLastVisit,
    'metrics.avgDaysBetweenVisits': m.avgDaysBetweenVisits,
    'metrics.ltv': m.ltv,
    'metrics.rfmScore': m.rfmScore,
    'metrics.repeatVisitRate': m.repeatVisitRate,
    'metrics.lastVisitAt': m.lastVisitAt,
    'metrics.firstVisitAt': m.firstVisitAt,
    'metrics.predictedReturnDate': m.predictedReturnDate,
  };

  return metricFieldMap[field] ?? null;
}

/**
 * Evaluate a single rule against a customer.
 */
function evaluateRule(customer: CustomerWithMetrics, rule: SegmentRule): boolean {
  const fieldValue = resolveField(customer, rule.field);

  switch (rule.operator) {
    case 'eq':
      return fieldValue === rule.value;

    case 'neq':
      return fieldValue !== rule.value;

    case 'gt':
      return typeof fieldValue === 'number' && typeof rule.value === 'number'
        ? fieldValue > rule.value
        : false;

    case 'gte':
      return typeof fieldValue === 'number' && typeof rule.value === 'number'
        ? fieldValue >= rule.value
        : false;

    case 'lt':
      return typeof fieldValue === 'number' && typeof rule.value === 'number'
        ? fieldValue < rule.value
        : false;

    case 'lte':
      return typeof fieldValue === 'number' && typeof rule.value === 'number'
        ? fieldValue <= rule.value
        : false;

    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(fieldValue);

    case 'not_in':
      return Array.isArray(rule.value) && !rule.value.includes(fieldValue);

    case 'is_null':
      return fieldValue === null || fieldValue === undefined;

    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined;

    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(rule.value);
      }
      if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
        return fieldValue.toLowerCase().includes(rule.value.toLowerCase());
      }
      return false;

    case 'between': {
      if (!Array.isArray(rule.value) || rule.value.length !== 2) return false;
      const [min, max] = rule.value as [number, number];
      return typeof fieldValue === 'number' && fieldValue >= min && fieldValue <= max;
    }

    default:
      return false;
  }
}

/**
 * Evaluate segment rules against a customer.
 */
function customerMatchesSegment(
  customer: CustomerWithMetrics,
  rulesJson: SegmentRulesJson,
): boolean {
  if (!rulesJson.rules || rulesJson.rules.length === 0) return false;

  const logic: RuleLogic = rulesJson.logic ?? 'AND';

  if (logic === 'AND') {
    return rulesJson.rules.every((rule) => evaluateRule(customer, rule));
  } else {
    return rulesJson.rules.some((rule) => evaluateRule(customer, rule));
  }
}

// ---------------------------------------------------------------------------
// Per-segment refresh
// ---------------------------------------------------------------------------

async function refreshSegment(
  segmentId: string,
  tenantId: string,
  customers: CustomerWithMetrics[],
): Promise<number> {
  const segment = await prisma.segment.findUnique({
    where: { id: segmentId },
  });

  if (!segment || !segment.isActive) return 0;

  const rulesJson = segment.rulesJson as SegmentRulesJson;

  // Evaluate which customers match
  const matchingCustomerIds = customers
    .filter((c) => customerMatchesSegment(c, rulesJson))
    .map((c) => c.id);

  // Existing memberships
  const existingMemberships = await prisma.segmentMembership.findMany({
    where: { segmentId },
    select: { customerId: true },
  });
  const existingIds = new Set(existingMemberships.map((m) => m.customerId));
  const newIds = new Set(matchingCustomerIds);

  // Remove customers no longer matching
  const toRemove = [...existingIds].filter((id) => !newIds.has(id));
  if (toRemove.length > 0) {
    await prisma.segmentMembership.deleteMany({
      where: { segmentId, customerId: { in: toRemove } },
    });
  }

  // Add newly matching customers
  const toAdd = matchingCustomerIds.filter((id) => !existingIds.has(id));
  if (toAdd.length > 0) {
    await prisma.segmentMembership.createMany({
      data: toAdd.map((customerId) => ({
        segmentId,
        customerId,
        tenantId,
      })),
      skipDuplicates: true,
    });
  }

  const customerCount = matchingCustomerIds.length;

  await prisma.segment.update({
    where: { id: segmentId },
    data: {
      customerCount,
      lastComputedAt: new Date(),
    },
  });

  return customerCount;
}

// ---------------------------------------------------------------------------
// Main processor
// ---------------------------------------------------------------------------

export async function segmentRefreshProcessor(
  job: Job<SegmentRefreshJobData>,
): Promise<void> {
  const { tenantId, segmentId } = job.data;
  const log = (msg: string) =>
    console.info(`[segment-refresh] job=${job.id} tenant=${tenantId} ${msg}`);

  log(segmentId ? `Refreshing segment ${segmentId}` : 'Refreshing all segments');

  // Load all active customers with their metrics in one query
  const customers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    include: { metrics: true },
  }) as CustomerWithMetrics[];

  log(`Loaded ${customers.length} customers`);

  if (segmentId) {
    const count = await refreshSegment(segmentId, tenantId, customers);
    log(`Segment ${segmentId} → ${count} members`);
  } else {
    const segments = await prisma.segment.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true },
    });

    let processed = 0;
    let errors = 0;

    for (const seg of segments) {
      try {
        const count = await refreshSegment(seg.id, tenantId, customers);
        log(`Segment "${seg.name}" (${seg.id}) → ${count} members`);
        processed++;
      } catch (err) {
        errors++;
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[segment-refresh] Failed segment ${seg.id}: ${message}`,
        );
      }

      if (processed % 10 === 0) {
        await job.updateProgress(Math.round((processed / segments.length) * 100));
      }
    }

    log(`Refreshed ${processed} segments (${errors} errors)`);
  }
}
