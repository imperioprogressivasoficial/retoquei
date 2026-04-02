/**
 * Segment utilities and helper functions
 */

export type SegmentType = 'AT_RISK' | 'ACTIVE' | 'VIP' | 'NEW' | 'LOST'

export const SEGMENT_DESCRIPTIONS: Record<SegmentType, string> = {
  AT_RISK: 'Clientes que não visitaram há mais de 45 dias',
  ACTIVE: 'Clientes que visitaram nos últimos 30 dias',
  VIP: 'Clientes que gastaram mais de R$2.000',
  NEW: 'Clientes cadastrados há menos de 30 dias',
  LOST: 'Clientes sem visitas há mais de 120 dias',
}

export const SEGMENT_DISPLAY_NAMES: Record<SegmentType, string> = {
  AT_RISK: 'Em Risco',
  ACTIVE: 'Ativos',
  VIP: 'VIP',
  NEW: 'Novos',
  LOST: 'Perdidos',
}

/**
 * Calculate days since last visit
 */
export function getDaysSinceLastVisit(lastVisitAt: Date | null): number | null {
  if (!lastVisitAt) return null
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - lastVisitAt.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Determine lifecycle stage based on customer metrics
 */
export function determineLifecycleStage(
  daysSinceLastVisit: number | null,
  totalSpent: number,
  totalAppointments: number,
  createdAt: Date
): string {
  // New customer (created less than 30 days ago)
  const createdDaysAgo = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (createdDaysAgo < 30 && totalAppointments < 3) {
    return 'NEW'
  }

  // No visit data
  if (daysSinceLastVisit === null) {
    return 'NEW'
  }

  // VIP (high spend)
  if (totalSpent >= 2000) {
    return 'VIP'
  }

  // Active (visited in last 30 days)
  if (daysSinceLastVisit <= 30) {
    return 'ACTIVE'
  }

  // At risk (45-120 days without visit)
  if (daysSinceLastVisit > 45 && daysSinceLastVisit <= 120) {
    return 'AT_RISK'
  }

  // Lost (more than 120 days)
  if (daysSinceLastVisit > 120) {
    return 'LOST'
  }

  // Recurring (visited but not recently)
  if (daysSinceLastVisit > 30 && daysSinceLastVisit <= 45) {
    return 'RECURRING'
  }

  return 'DORMANT'
}

/**
 * Format segment rule for display
 */
export function formatSegmentRule(rule: any): string {
  if (!rule || Object.keys(rule).length === 0) {
    return 'Sem filtros (todos os clientes)'
  }

  if (rule.and && Array.isArray(rule.and)) {
    return rule.and.map((c: any) => formatCondition(c)).join(' E ')
  }

  if (rule.or && Array.isArray(rule.or)) {
    return rule.or.map((c: any) => formatCondition(c)).join(' OU ')
  }

  return formatCondition(rule)
}

function formatCondition(cond: any): string {
  const { field, op, value } = cond

  const fieldLabels: Record<string, string> = {
    lifecycle_stage: 'Estágio',
    risk_level: 'Nível de Risco',
    days_since_visit: 'Dias desde última visita',
    total_spent: 'Total gasto',
    visit_frequency: 'Frequência de visitas',
    service_preference: 'Serviço preferido',
    tags: 'Tags',
  }

  const fieldLabel = fieldLabels[field] || field

  switch (op) {
    case 'eq':
      return `${fieldLabel} = ${value}`
    case 'in':
      return `${fieldLabel} em [${Array.isArray(value) ? value.join(', ') : value}]`
    case 'gt':
      return `${fieldLabel} > ${value}`
    case 'gte':
      return `${fieldLabel} >= ${value}`
    case 'lt':
      return `${fieldLabel} < ${value}`
    case 'lte':
      return `${fieldLabel} <= ${value}`
    case 'contains':
      return `${fieldLabel} contém ${value}`
    default:
      return `${fieldLabel} ${op} ${value}`
  }
}
