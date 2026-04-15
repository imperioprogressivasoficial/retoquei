// Segment Rule Engine
// Evaluates rulesJson from Segment model against client data

export interface SegmentRule {
  field: string
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'greaterThan'
    | 'lessThan'
    | 'between'
    | 'daysSince'
    | 'in'
  value: any
}

export interface SegmentRules {
  all?: boolean
  conditions?: SegmentRule[]
  match?: 'all' | 'any'
}

export interface ClientData {
  lifecycleStage: string
  visitCount: number
  lastVisitAt: Date | null
  totalSpent: number
  averageTicket: number
  ltv: number
  birthDate: Date | null
  tags: string[]
  source?: string
}

export function evaluateSegmentRules(
  rules: SegmentRules | null,
  client: ClientData
): boolean {
  if (!rules) return false
  if (rules.all === true) return true
  if (!rules.conditions || rules.conditions.length === 0) return false

  const matchFn =
    rules.match === 'any'
      ? rules.conditions.some.bind(rules.conditions)
      : rules.conditions.every.bind(rules.conditions)

  return matchFn((condition) => evaluateCondition(condition, client))
}

function evaluateCondition(rule: SegmentRule, client: ClientData): boolean {
  const fieldValue = getFieldValue(client, rule.field)

  switch (rule.operator) {
    case 'equals':
      return String(fieldValue) === String(rule.value)
    case 'notEquals':
      return String(fieldValue) !== String(rule.value)
    case 'contains':
      if (Array.isArray(fieldValue)) return fieldValue.includes(rule.value)
      return String(fieldValue)
        .toLowerCase()
        .includes(String(rule.value).toLowerCase())
    case 'greaterThan':
      return Number(fieldValue) > Number(rule.value)
    case 'lessThan':
      return Number(fieldValue) < Number(rule.value)
    case 'between': {
      const [min, max] = Array.isArray(rule.value) ? rule.value : [0, 0]
      return (
        Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max)
      )
    }
    case 'daysSince': {
      if (!fieldValue) return false
      const date =
        fieldValue instanceof Date ? fieldValue : new Date(String(fieldValue))
      if (isNaN(date.getTime())) return false
      const daysDiff = Math.floor(
        (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysDiff >= Number(rule.value)
    }
    case 'in': {
      const allowed = Array.isArray(rule.value) ? rule.value : [rule.value]
      return allowed.includes(fieldValue)
    }
    default:
      return false
  }
}

function getFieldValue(client: ClientData, field: string): any {
  switch (field) {
    case 'lifecycleStage':
      return client.lifecycleStage
    case 'visitCount':
      return client.visitCount
    case 'lastVisitAt':
      return client.lastVisitAt
    case 'totalSpent':
      return Number(client.totalSpent)
    case 'averageTicket':
      return Number(client.averageTicket)
    case 'ltv':
      return Number(client.ltv)
    case 'birthDate':
      return client.birthDate
    case 'tags':
      return client.tags
    case 'source':
      return client.source
    default:
      return undefined
  }
}
