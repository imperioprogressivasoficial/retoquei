import type { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Segmentation Service
// Evaluates dynamic segment rules and manages segment membership.
// ---------------------------------------------------------------------------

// ─── Rules DSL ───────────────────────────────────────────────────────────────

type RuleOp = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'is_null' | 'is_not_null'

interface LeafRule {
  field: string
  op: RuleOp
  value?: unknown
}

interface AndRule { and: SegmentRule[] }
interface OrRule  { or: SegmentRule[] }
interface NotRule { not: SegmentRule }

type SegmentRule = LeafRule | AndRule | OrRule | NotRule

// ─── Customer projection for rule evaluation ─────────────────────────────────

interface CustomerProjection {
  lifecycleStage: string
  riskLevel: string
  daysSinceLastVisit: number | null
  avgDaysBetweenVisits: number | null
  totalAppointments: number
  totalSpent: number
  avgTicket: number
  ltv: number
  repeatVisitRate: number
  rfmScore: number
  birthdateMonth: number | null
  tags: string[]
}

// ─── System segment definitions ──────────────────────────────────────────────

export const SYSTEM_SEGMENTS = [
  {
    key: 'new_customers',
    name: 'Novos Clientes',
    description: 'Clientes com menos de 2 visitas',
    rules: { or: [{ field: 'lifecycleStage', op: 'eq', value: 'NEW' }, { field: 'totalAppointments', op: 'lte', value: 1 }] } as SegmentRule,
  },
  {
    key: 'recurring_customers',
    name: 'Clientes Recorrentes',
    description: 'Clientes que retornam regularmente',
    rules: { field: 'lifecycleStage', op: 'eq', value: 'RECURRING' } as SegmentRule,
  },
  {
    key: 'vip_customers',
    name: 'Clientes VIP',
    description: 'Clientes de alto valor e alta frequência',
    rules: { field: 'lifecycleStage', op: 'eq', value: 'VIP' } as SegmentRule,
  },
  {
    key: 'at_risk',
    name: 'Em Risco',
    description: 'Clientes que podem não voltar',
    rules: { field: 'lifecycleStage', op: 'eq', value: 'AT_RISK' } as SegmentRule,
  },
  {
    key: 'lost_customers',
    name: 'Clientes Perdidos',
    description: 'Clientes que não voltam há muito tempo',
    rules: { field: 'lifecycleStage', op: 'eq', value: 'LOST' } as SegmentRule,
  },
  {
    key: 'inactive_30d',
    name: 'Inativos 30 dias',
    description: 'Sem visita nos últimos 30 dias',
    rules: { field: 'daysSinceLastVisit', op: 'gte', value: 30 } as SegmentRule,
  },
  {
    key: 'inactive_60d',
    name: 'Inativos 60 dias',
    description: 'Sem visita nos últimos 60 dias',
    rules: { field: 'daysSinceLastVisit', op: 'gte', value: 60 } as SegmentRule,
  },
  {
    key: 'inactive_90d',
    name: 'Inativos 90 dias',
    description: 'Sem visita nos últimos 90 dias',
    rules: { field: 'daysSinceLastVisit', op: 'gte', value: 90 } as SegmentRule,
  },
  {
    key: 'high_ticket',
    name: 'Alto Ticket',
    description: 'Clientes com ticket médio acima de R$150',
    rules: { field: 'avgTicket', op: 'gte', value: 150 } as SegmentRule,
  },
  {
    key: 'high_frequency',
    name: 'Alta Frequência',
    description: 'Clientes que visitam pelo menos 1x por mês',
    rules: { and: [{ field: 'avgDaysBetweenVisits', op: 'lte', value: 30 }, { field: 'totalAppointments', op: 'gte', value: 3 }] } as SegmentRule,
  },
  {
    key: 'low_frequency',
    name: 'Baixa Frequência',
    description: 'Clientes que visitam com pouca frequência',
    rules: { and: [{ field: 'avgDaysBetweenVisits', op: 'gte', value: 60 }, { field: 'totalAppointments', op: 'gte', value: 2 }] } as SegmentRule,
  },
  {
    key: 'birthday_this_month',
    name: 'Aniversariantes do Mês',
    description: 'Clientes com aniversário no mês atual',
    rules: { field: 'birthdateMonth', op: 'eq', value: new Date().getMonth() + 1 } as SegmentRule,
  },
]

export class SegmentationService {
  // ─── Rule evaluation ────────────────────────────────────────────────────

  evaluateRules(customer: CustomerProjection, rule: SegmentRule): boolean {
    if ('and' in rule) {
      return (rule as AndRule).and.every((r) => this.evaluateRules(customer, r))
    }
    if ('or' in rule) {
      return (rule as OrRule).or.some((r) => this.evaluateRules(customer, r))
    }
    if ('not' in rule) {
      return !this.evaluateRules(customer, (rule as NotRule).not)
    }

    // Leaf rule
    const leaf = rule as LeafRule
    const value = this._getField(customer, leaf.field)

    switch (leaf.op) {
      case 'eq':  return value === leaf.value
      case 'neq': return value !== leaf.value
      case 'gt':  return typeof value === 'number' && value > (leaf.value as number)
      case 'lt':  return typeof value === 'number' && value < (leaf.value as number)
      case 'gte': return typeof value === 'number' && value >= (leaf.value as number)
      case 'lte': return typeof value === 'number' && value <= (leaf.value as number)
      case 'in':  return Array.isArray(leaf.value) && (leaf.value as unknown[]).includes(value)
      case 'not_in': return Array.isArray(leaf.value) && !(leaf.value as unknown[]).includes(value)
      case 'contains':
        if (Array.isArray(value)) return value.includes(leaf.value)
        return typeof value === 'string' && value.includes(String(leaf.value))
      case 'is_null': return value === null || value === undefined
      case 'is_not_null': return value !== null && value !== undefined
      default: return false
    }
  }

  // ─── Segment refresh ────────────────────────────────────────────────────

  async refreshSegment(
    segmentId: string,
    db: PrismaClient,
  ): Promise<{ added: number; removed: number }> {
    const segment = await db.segment.findUnique({ where: { id: segmentId } })
    if (!segment || !segment.isActive) return { added: 0, removed: 0 }

    const rules = segment.rulesJson as SegmentRule

    // Load all customers with their metrics
    const customers = await db.customer.findMany({
      where: { tenantId: segment.tenantId, deletedAt: null },
      include: { metrics: true },
    })

    const currentMonth = new Date().getMonth() + 1
    const qualifying = new Set<string>()

    for (const customer of customers) {
      const projection: CustomerProjection = {
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

      if (this.evaluateRules(projection, rules)) {
        qualifying.add(customer.id)
      }
    }

    // Get current memberships
    const existing = await db.segmentMembership.findMany({
      where: { segmentId },
      select: { customerId: true },
    })
    const existingSet = new Set(existing.map((m) => m.customerId))

    // Compute diff
    const toAdd = [...qualifying].filter((id) => !existingSet.has(id))
    const toRemove = [...existingSet].filter((id) => !qualifying.has(id))

    // Apply changes in batches
    if (toAdd.length > 0) {
      await db.segmentMembership.createMany({
        data: toAdd.map((customerId) => ({ segmentId, customerId })),
        skipDuplicates: true,
      })
    }

    if (toRemove.length > 0) {
      await db.segmentMembership.deleteMany({
        where: { segmentId, customerId: { in: toRemove } },
      })
    }

    // Update count
    await db.segment.update({
      where: { id: segmentId },
      data: { customerCount: qualifying.size, lastComputedAt: new Date() },
    })

    return { added: toAdd.length, removed: toRemove.length }
  }

  async refreshAllSegmentsForTenant(tenantId: string, db: PrismaClient): Promise<void> {
    const segments = await db.segment.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
    })

    for (const { id } of segments) {
      try {
        await this.refreshSegment(id, db)
      } catch (err) {
        console.error(`[Segmentation] Error refreshing segment ${id}:`, err)
      }
    }
  }

  // ─── Seed system segments ────────────────────────────────────────────────

  async seedSystemSegments(tenantId: string, db: PrismaClient): Promise<void> {
    for (const def of SYSTEM_SEGMENTS) {
      const existing = await db.segment.findFirst({
        where: { tenantId, isSystem: true, name: def.name },
      })
      if (existing) continue

      await db.segment.create({
        data: {
          tenantId,
          name: def.name,
          description: def.description,
          type: 'SYSTEM',
          rulesJson: def.rules as object,
          isSystem: true,
          isActive: true,
        },
      })
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private _getField(customer: CustomerProjection, field: string): unknown {
    return (customer as Record<string, unknown>)[field] ?? null
  }
}

export const segmentationService = new SegmentationService()
