import { Job } from 'bullmq'
import prisma from '../lib/prisma'
import { SegmentRefreshJobData } from '../queues'
import { Client, LifecycleStage } from '@prisma/client'

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
  | 'between'

type RuleLogic = 'AND' | 'OR'

interface SegmentRule {
  field: string
  operator: RuleOperator
  value?: unknown
}

interface SegmentRulesJson {
  logic?: RuleLogic
  rules: SegmentRule[]
}

/**
 * Resolve a field from a client record.
 */
function resolveField(client: Client, field: string): unknown {
  const fieldMap: Record<string, unknown> = {
    lifecycleStage: client.lifecycleStage,
    whatsappOptIn: client.whatsappOptIn,
    tags: client.tags,
    createdAt: client.createdAt,
    birthDate: client.birthDate,
    phone: client.phone,
    email: client.email,
    source: client.source,
    visitCount: client.visitCount,
    totalSpent: Number(client.totalSpent),
    averageTicket: Number(client.averageTicket),
    ltv: Number(client.ltv),
    averageIntervalDays: client.averageIntervalDays,
    firstVisitAt: client.firstVisitAt,
    lastVisitAt: client.lastVisitAt,
  }

  return fieldMap[field] ?? null
}

/**
 * Evaluate a single rule against a client.
 */
function evaluateRule(client: Client, rule: SegmentRule): boolean {
  const fieldValue = resolveField(client, rule.field)

  switch (rule.operator) {
    case 'eq':
      return fieldValue === rule.value

    case 'neq':
      return fieldValue !== rule.value

    case 'gt':
      return typeof fieldValue === 'number' && typeof rule.value === 'number'
        ? fieldValue > rule.value
        : false

    case 'gte':
      return typeof fieldValue === 'number' && typeof rule.value === 'number'
        ? fieldValue >= rule.value
        : false

    case 'lt':
      return typeof fieldValue === 'number' && typeof rule.value === 'number'
        ? fieldValue < rule.value
        : false

    case 'lte':
      return typeof fieldValue === 'number' && typeof rule.value === 'number'
        ? fieldValue <= rule.value
        : false

    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(fieldValue)

    case 'not_in':
      return Array.isArray(rule.value) && !rule.value.includes(fieldValue)

    case 'is_null':
      return fieldValue === null || fieldValue === undefined

    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined

    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(rule.value)
      }
      if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
        return fieldValue.toLowerCase().includes(rule.value.toLowerCase())
      }
      return false

    case 'between': {
      if (!Array.isArray(rule.value) || rule.value.length !== 2) return false
      const [min, max] = rule.value as [number, number]
      return typeof fieldValue === 'number' && fieldValue >= min && fieldValue <= max
    }

    default:
      return false
  }
}

/**
 * Evaluate segment rules against a client.
 */
function clientMatchesSegment(
  client: Client,
  rulesJson: SegmentRulesJson,
): boolean {
  if (!rulesJson.rules || rulesJson.rules.length === 0) return false

  const logic: RuleLogic = rulesJson.logic ?? 'AND'

  if (logic === 'AND') {
    return rulesJson.rules.every((rule) => evaluateRule(client, rule))
  } else {
    return rulesJson.rules.some((rule) => evaluateRule(client, rule))
  }
}

// ---------------------------------------------------------------------------
// Per-segment refresh
// ---------------------------------------------------------------------------

async function refreshSegment(
  segmentId: string,
  salonId: string,
  clients: Client[],
): Promise<number> {
  const segment = await prisma.segment.findUnique({
    where: { id: segmentId },
  })

  if (!segment) return 0

  const rulesJson = segment.rulesJson as SegmentRulesJson | null
  if (!rulesJson || !rulesJson.rules) return 0

  // Evaluate which clients match
  const matchingClientIds = clients
    .filter((c) => clientMatchesSegment(c, rulesJson))
    .map((c) => c.id)

  // Existing memberships
  const existingMemberships = await prisma.clientSegment.findMany({
    where: { segmentId },
    select: { clientId: true },
  })
  const existingIds = new Set(existingMemberships.map((m) => m.clientId))
  const newIds = new Set(matchingClientIds)

  // Remove clients no longer matching
  const toRemove = [...existingIds].filter((id) => !newIds.has(id))
  if (toRemove.length > 0) {
    await prisma.clientSegment.deleteMany({
      where: { segmentId, clientId: { in: toRemove } },
    })
  }

  // Add newly matching clients
  const toAdd = matchingClientIds.filter((id) => !existingIds.has(id))
  if (toAdd.length > 0) {
    await prisma.clientSegment.createMany({
      data: toAdd.map((clientId) => ({
        segmentId,
        clientId,
        salonId,
      })),
      skipDuplicates: true,
    })
  }

  return matchingClientIds.length
}

// ---------------------------------------------------------------------------
// Main processor
// ---------------------------------------------------------------------------

export async function segmentRefreshProcessor(
  job: Job<SegmentRefreshJobData>,
): Promise<void> {
  const { salonId, segmentId } = job.data
  const log = (msg: string) =>
    console.info(`[segment-refresh] job=${job.id} salon=${salonId} ${msg}`)

  log(segmentId ? `Refreshing segment ${segmentId}` : 'Refreshing all segments')

  // Load all active clients in one query
  const clients = await prisma.client.findMany({
    where: { salonId, deletedAt: null },
  })

  log(`Loaded ${clients.length} clients`)

  if (segmentId) {
    const count = await refreshSegment(segmentId, salonId, clients)
    log(`Segment ${segmentId} -> ${count} members`)
  } else {
    const segments = await prisma.segment.findMany({
      where: { salonId, archivedAt: null },
      select: { id: true, name: true },
    })

    let processed = 0
    let errors = 0

    for (const seg of segments) {
      try {
        const count = await refreshSegment(seg.id, salonId, clients)
        log(`Segment "${seg.name}" (${seg.id}) -> ${count} members`)
        processed++
      } catch (err) {
        errors++
        const message = err instanceof Error ? err.message : String(err)
        console.error(
          `[segment-refresh] Failed segment ${seg.id}: ${message}`,
        )
      }

      if (processed % 10 === 0) {
        await job.updateProgress(Math.round((processed / segments.length) * 100))
      }
    }

    log(`Refreshed ${processed} segments (${errors} errors)`)
  }
}
