import type { LifecycleStageKey, RiskLevelKey } from '@/lib/constants'

// Re-export for convenience
export type LifecycleStage = LifecycleStageKey
export type RiskLevel = RiskLevelKey

// ─────────────────────────────────────────────
// Core Customer
// ─────────────────────────────────────────────

export interface Customer {
  id: string
  tenantId: string
  /** Normalized E.164 phone number (primary identifier for deduplication) */
  phoneNormalized: string
  /** Raw phone number as imported */
  phoneRaw: string | null
  name: string
  email: string | null
  birthdate: Date | null
  /** Customer notes (free text) */
  notes: string | null
  /** Whether this customer record has been soft-deleted */
  isArchived: boolean
  /** Connector that first created this customer */
  sourceConnectorId: string | null
  /** External ID in the source system */
  externalId: string | null
  /** Arbitrary tags assigned by the tenant */
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Customer Metrics (computed, stored in DB)
// ─────────────────────────────────────────────

export interface CustomerMetrics {
  customerId: string
  tenantId: string
  /** Total number of confirmed appointments */
  totalAppointments: number
  /** Total amount spent (sum of appointment values) */
  totalSpent: number
  /** Average spend per appointment */
  avgTicket: number
  /** Date of first appointment */
  firstVisitDate: Date | null
  /** Date of most recent appointment */
  lastVisitDate: Date | null
  /** Number of days since last visit (computed at recompute time) */
  daysSinceLastVisit: number | null
  /** Average number of days between consecutive visits */
  avgDaysBetweenVisits: number | null
  /** Predicted date of next visit based on avg cadence */
  predictedReturnDate: Date | null
  /** Composite Lifetime Value score */
  ltv: number
  /** RFM composite score (0-100) */
  rfmScore: number | null
  /** Repeat visit rate: appointments / months active */
  repeatVisitRate: number | null
  /** Current lifecycle stage */
  lifecycleStage: LifecycleStage
  /** Current risk level */
  riskLevel: RiskLevel
  /** Last time metrics were recomputed */
  lastRecomputedAt: Date
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Customer with Metrics (joined)
// ─────────────────────────────────────────────

export type CustomerWithMetrics = Customer & {
  metrics: CustomerMetrics | null
}

// ─────────────────────────────────────────────
// Appointment (raw record)
// ─────────────────────────────────────────────

export interface Appointment {
  id: string
  tenantId: string
  customerId: string
  connectorId: string | null
  externalId: string | null
  /** Date and time of the appointment */
  appointmentDate: Date
  /** Services performed */
  services: AppointmentService[]
  /** Total amount charged */
  totalValue: number
  status: AppointmentStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export interface AppointmentService {
  serviceId: string | null
  serviceName: string
  price: number
  duration: number | null // minutes
}

// ─────────────────────────────────────────────
// Service (catalog)
// ─────────────────────────────────────────────

export interface Service {
  id: string
  tenantId: string
  name: string
  category: string | null
  defaultPrice: number
  defaultDuration: number | null // minutes
  isActive: boolean
  externalId: string | null
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────

export interface CustomerFilter {
  /** Free-text search across name, phone, email */
  search?: string
  lifecycleStage?: LifecycleStage[]
  riskLevel?: RiskLevel[]
  tags?: string[]
  segmentIds?: string[]
  minLtv?: number
  maxLtv?: number
  minAvgTicket?: number
  maxAvgTicket?: number
  minTotalAppointments?: number
  maxTotalAppointments?: number
  lastVisitAfter?: Date
  lastVisitBefore?: Date
  birthdateMonth?: number // 1-12
  isArchived?: boolean
}

export interface CustomerSortOptions {
  field:
    | 'name'
    | 'createdAt'
    | 'lastVisitDate'
    | 'totalAppointments'
    | 'totalSpent'
    | 'avgTicket'
    | 'ltv'
    | 'daysSinceLastVisit'
    | 'rfmScore'
  direction: 'asc' | 'desc'
}

// ─────────────────────────────────────────────
// Import / Parsed types (used by connectors)
// ─────────────────────────────────────────────

export interface ParsedCustomer {
  name: string
  phoneRaw: string
  phoneNormalized: string
  email: string | null
  birthdate: Date | null
  notes: string | null
  externalId: string | null
  tags: string[]
  /** Row index for error reporting */
  rowIndex?: number
}

export interface ParsedAppointment {
  customerPhone: string
  customerName: string | null
  appointmentDate: Date
  services: Array<{ name: string; price: number }>
  totalValue: number
  status: AppointmentStatus
  externalId: string | null
  notes: string | null
  rowIndex?: number
}

export interface ParsedService {
  name: string
  category: string | null
  defaultPrice: number
  defaultDuration: number | null
  externalId: string | null
  rowIndex?: number
}

// ─────────────────────────────────────────────
// Retention Cohort
// ─────────────────────────────────────────────

export interface RetentionCohort {
  /** e.g. "2026-01" */
  cohortMonth: string
  /** Customers who had their first visit in this month */
  cohortSize: number
  /** Retention percentage per subsequent month offset */
  retention: Record<number, number> // offset (1, 2, 3...) → % retained
}

// ─────────────────────────────────────────────
// Input type for analytics calculations
// ─────────────────────────────────────────────

export interface CustomerMetricsInput {
  totalAppointments: number
  totalSpent: number
  avgTicket: number
  firstVisitDate: Date | null
  lastVisitDate: Date | null
  daysSinceLastVisit: number | null
  avgDaysBetweenVisits: number | null
}
