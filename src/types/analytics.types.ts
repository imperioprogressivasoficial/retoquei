import type { LifecycleStage, RiskLevel, RetentionCohort } from './customer.types'

// Re-export for convenience
export type { RetentionCohort }

// ─────────────────────────────────────────────
// Dashboard KPIs
// ─────────────────────────────────────────────

export interface DashboardKPIs {
  /** Total number of active (non-archived) customers */
  totalCustomers: number
  /** Customers added in the current month */
  newCustomersThisMonth: number
  /** Percentage change vs previous month */
  newCustomersMoMChange: number | null

  /** Customers with RECURRING or VIP lifecycle stage */
  activeCustomers: number
  /** % of total customers who are active */
  activeCustomersPct: number

  /** Customers at risk or lost */
  atRiskCustomers: number
  atRiskCustomersPct: number

  /** Customers with lifecycle stage = LOST */
  lostCustomers: number
  lostCustomersPct: number

  /** Total messages sent in current month */
  messagesSentThisMonth: number
  /** Delivery rate (delivered / sent) */
  deliveryRatePct: number | null
  /** Read rate (read / delivered) */
  readRatePct: number | null

  /** Average ticket across all appointments (all time) */
  avgTicketAllTime: number
  /** Average ticket in the current month */
  avgTicketThisMonth: number | null
  /** MoM change in avg ticket */
  avgTicketMoMChange: number | null

  /** Total revenue in current month */
  revenueThisMonth: number | null
  /** MoM change in revenue */
  revenueMoMChange: number | null

  /** Average days since last visit (at-risk + lost customers) */
  avgDaysSinceLastVisit: number | null

  /** Last time any sync ran for this tenant */
  lastSyncAt: Date | null

  /** Computed at */
  computedAt: Date
}

// ─────────────────────────────────────────────
// Evolution Chart
// ─────────────────────────────────────────────

export interface CustomerEvolutionPoint {
  /** ISO date string "YYYY-MM" */
  month: string
  /** Human-readable label (e.g. "Mar 2026") */
  label: string
  newCustomers: number
  activeCustomers: number
  atRiskCustomers: number
  lostCustomers: number
  totalCustomers: number
}

// ─────────────────────────────────────────────
// Retention Data
// ─────────────────────────────────────────────

export interface RetentionDataPoint {
  /** Period label (e.g. "Mar 2026") */
  period: string
  /** First-time customers in this period */
  newCustomers: number
  /** Of those, how many returned the next period */
  retained1Period: number
  /** Retention rate in percent */
  retentionRate: number
}

// ─────────────────────────────────────────────
// Segment Distribution
// ─────────────────────────────────────────────

export interface SegmentDistribution {
  segmentId: string
  segmentName: string
  customerCount: number
  /** Percentage of total customers */
  percentage: number
  /** Color for chart rendering */
  color: string
}

// ─────────────────────────────────────────────
// Lifecycle Distribution
// ─────────────────────────────────────────────

export interface LifecycleDistribution {
  stage: LifecycleStage
  label: string
  count: number
  percentage: number
  color: string
}

// ─────────────────────────────────────────────
// Risk Distribution
// ─────────────────────────────────────────────

export interface RiskDistribution {
  level: RiskLevel
  label: string
  count: number
  percentage: number
  color: string
}

// ─────────────────────────────────────────────
// Revenue Trend
// ─────────────────────────────────────────────

export interface RevenueTrendPoint {
  month: string
  label: string
  revenue: number
  appointments: number
  avgTicket: number
  uniqueCustomers: number
}

// ─────────────────────────────────────────────
// Top Customers
// ─────────────────────────────────────────────

export interface TopCustomer {
  customerId: string
  name: string
  phoneNormalized: string
  totalSpent: number
  totalAppointments: number
  avgTicket: number
  lifecycleStage: LifecycleStage
  lastVisitDate: Date | null
}

// ─────────────────────────────────────────────
// Campaign Analytics
// ─────────────────────────────────────────────

export interface CampaignAnalytics {
  campaignId: string
  campaignName: string
  sentAt: Date | null
  recipientCount: number
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  deliveryRatePct: number | null
  readRatePct: number | null
}

// ─────────────────────────────────────────────
// Full analytics response
// ─────────────────────────────────────────────

export interface TenantAnalytics {
  kpis: DashboardKPIs
  customerEvolution: CustomerEvolutionPoint[]
  retentionData: RetentionDataPoint[]
  lifecycleDistribution: LifecycleDistribution[]
  riskDistribution: RiskDistribution[]
  segmentDistribution: SegmentDistribution[]
  revenueTrend: RevenueTrendPoint[]
  topCustomers: TopCustomer[]
  retentionCohorts: RetentionCohort[]
}
