import type { PrismaClient } from '@prisma/client'
import { differenceInDays, addDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'

// ---------------------------------------------------------------------------
// Customer Intelligence Engine
// Computes all behavioral metrics, lifecycle stages, and risk levels.
// ---------------------------------------------------------------------------

interface TenantThresholds {
  atRiskMultiplier: number      // default: 1.3 — AT_RISK when days_since > avg * this
  lostMultiplier: number        // default: 2.0 — LOST when days_since > avg * this
  lostMinDays: number           // default: 60  — never LOST before this many days
  vipMinAppointments: number    // default: 10
  vipAvgTicketMultiplier: number // default: 1.5 — VIP if avg_ticket > median * this
}

const DEFAULT_THRESHOLDS: TenantThresholds = {
  atRiskMultiplier: 1.3,
  lostMultiplier: 2.0,
  lostMinDays: 60,
  vipMinAppointments: 10,
  vipAvgTicketMultiplier: 1.5,
}

export type LifecycleStage = 'NEW' | 'ACTIVE' | 'RECURRING' | 'VIP' | 'AT_RISK' | 'LOST' | 'DORMANT'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'LOST'

interface CustomerMetricsInput {
  totalAppointments: number
  totalSpent: number
  firstVisitAt: Date | null
  lastVisitAt: Date | null
  avgDaysBetweenVisits: number | null
  daysSinceLastVisit: number | null
  birthdate?: Date | null
}

export interface RetentionCohort {
  month: string // YYYY-MM
  newCustomers: number
  returningCustomers: number
  retentionRate: number
}

export class CustomerAnalyticsService {
  // ─── Core calculations ────────────────────────────────────────────────────

  calculateAvgDaysBetweenVisits(appointmentDates: Date[]): number {
    if (appointmentDates.length < 2) return 0

    const sorted = [...appointmentDates].sort((a, b) => a.getTime() - b.getTime())
    let totalGap = 0
    for (let i = 1; i < sorted.length; i++) {
      totalGap += differenceInDays(sorted[i], sorted[i - 1])
    }

    return Math.round(totalGap / (sorted.length - 1))
  }

  calculatePredictedReturnDate(lastVisit: Date, avgDaysBetweenVisits: number): Date {
    if (!avgDaysBetweenVisits || avgDaysBetweenVisits <= 0) {
      return addDays(new Date(), 30) // Default: 30 days from now
    }
    return addDays(lastVisit, avgDaysBetweenVisits)
  }

  calculateDaysSinceLastVisit(lastVisit: Date | null): number {
    if (!lastVisit) return 9999
    return Math.max(0, differenceInDays(new Date(), lastVisit))
  }

  calculateLifecycleStage(
    metrics: CustomerMetricsInput,
    tenantAvgTicket: number,
    thresholds: TenantThresholds = DEFAULT_THRESHOLDS,
  ): LifecycleStage {
    const { totalAppointments, lastVisitAt, avgDaysBetweenVisits, daysSinceLastVisit, avgTicket } = {
      ...metrics,
      avgTicket: metrics.totalAppointments > 0 ? metrics.totalSpent / metrics.totalAppointments : 0,
    }

    // Never visited
    if (!lastVisitAt || totalAppointments === 0) return 'NEW'

    const daysSince = daysSinceLastVisit ?? this.calculateDaysSinceLastVisit(lastVisitAt)
    const avgDays = avgDaysBetweenVisits ?? 45

    // VIP: many visits + high value
    const vipTicketThreshold = tenantAvgTicket * thresholds.vipAvgTicketMultiplier
    if (
      totalAppointments >= thresholds.vipMinAppointments &&
      avgTicket >= vipTicketThreshold
    ) {
      return 'VIP'
    }

    // LOST: very long since last visit
    const lostDaysThreshold = Math.max(
      avgDays * thresholds.lostMultiplier,
      thresholds.lostMinDays,
    )
    if (daysSince >= lostDaysThreshold) return 'LOST'

    // AT_RISK: overdue
    const atRiskThreshold = avgDays * thresholds.atRiskMultiplier
    if (daysSince >= atRiskThreshold) return 'AT_RISK'

    // Recurring: 3+ visits
    if (totalAppointments >= 3) return 'RECURRING'

    // Active: visited at least once, within expected window
    if (totalAppointments >= 1) return 'ACTIVE'

    return 'NEW'
  }

  calculateRiskLevel(
    daysSinceLastVisit: number,
    avgDaysBetweenVisits: number,
    thresholds: TenantThresholds = DEFAULT_THRESHOLDS,
  ): RiskLevel {
    if (!avgDaysBetweenVisits || avgDaysBetweenVisits <= 0) return 'LOW'

    const lostThreshold = Math.max(avgDaysBetweenVisits * thresholds.lostMultiplier, thresholds.lostMinDays)
    if (daysSinceLastVisit >= lostThreshold) return 'LOST'

    const highThreshold = avgDaysBetweenVisits * thresholds.atRiskMultiplier
    if (daysSinceLastVisit >= highThreshold) return 'HIGH'

    const mediumThreshold = avgDaysBetweenVisits * 1.1
    if (daysSinceLastVisit >= mediumThreshold) return 'MEDIUM'

    return 'LOW'
  }

  /**
   * Customer Lifetime Value — estimated future value based on historical spend rate.
   * Simple formula: avg_monthly_spend × expected_remaining_months (capped at 24)
   */
  calculateLTV(
    totalSpent: number,
    firstVisitAt: Date,
    lastVisitAt: Date,
    avgDaysBetweenVisits: number,
  ): number {
    const monthsActive = Math.max(
      1,
      (lastVisitAt.getTime() - firstVisitAt.getTime()) / (1000 * 60 * 60 * 24 * 30),
    )
    const avgMonthlySpend = totalSpent / monthsActive

    // Project 12 months of future value
    const projectionMonths = avgDaysBetweenVisits > 0
      ? Math.min(12, Math.round((30 / avgDaysBetweenVisits) * 12))
      : 6

    return Math.round(avgMonthlySpend * projectionMonths * 100) / 100
  }

  calculateRepeatVisitRate(totalAppointments: number, monthsActive: number): number {
    if (monthsActive <= 1) return totalAppointments > 1 ? 1 : 0
    // Visits per month, normalised to 0-1 scale (1 = at least 1 visit/month)
    return Math.min(1, totalAppointments / monthsActive)
  }

  /**
   * RFM Score (0-100) — simplified single score.
   * R: recency (lower days_since = better), 40% weight
   * F: frequency (more appointments = better), 35% weight
   * M: monetary (higher total_spent = better), 25% weight
   */
  calculateRFMScore(
    recencyDays: number,
    frequency: number,
    monetaryValue: number,
    tenantMaxDays = 180,
    tenantMaxFreq = 30,
    tenantMaxMoney = 5000,
  ): number {
    const r = Math.max(0, 1 - recencyDays / tenantMaxDays) * 40
    const f = Math.min(1, frequency / tenantMaxFreq) * 35
    const m = Math.min(1, monetaryValue / tenantMaxMoney) * 25
    return Math.round(r + f + m)
  }

  // ─── Recompute single customer ────────────────────────────────────────────

  async recomputeCustomer(customerId: string, db: PrismaClient): Promise<void> {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: {
          where: { status: 'COMPLETED' },
          orderBy: { scheduledAt: 'asc' },
        },
        tenant: true,
      },
    })

    if (!customer) return

    const appointments = customer.appointments
    const thresholds: TenantThresholds = {
      atRiskMultiplier: customer.tenant.atRiskThresholdDays > 0 ? 1 : 1.3,
      lostMultiplier: customer.tenant.lostThresholdDays > 0 ? 1 : 2.0,
      lostMinDays: customer.tenant.lostThresholdDays > 0 ? customer.tenant.lostThresholdDays : 60,
      vipMinAppointments: customer.tenant.vipAppointmentCount,
      vipAvgTicketMultiplier: customer.tenant.vipAvgTicketMultiplier,
    }

    const completedDates = appointments.map((a) => a.scheduledAt)
    const totalSpent = appointments.reduce((s, a) => s + (a.price ?? 0), 0)
    const totalAppointments = appointments.length
    const firstVisitAt = completedDates[0] ?? null
    const lastVisitAt = completedDates[completedDates.length - 1] ?? null
    const avgDaysBetweenVisits = this.calculateAvgDaysBetweenVisits(completedDates)
    const daysSinceLastVisit = this.calculateDaysSinceLastVisit(lastVisitAt)
    const avgTicket = totalAppointments > 0 ? totalSpent / totalAppointments : 0

    // Get tenant avg ticket for VIP calculation
    const tenantMetrics = await db.customerMetrics.aggregate({
      where: { tenantId: customer.tenantId },
      _avg: { avgTicket: true },
    })
    const tenantAvgTicket = tenantMetrics._avg.avgTicket ?? 0

    const metricsInput: CustomerMetricsInput = {
      totalAppointments,
      totalSpent,
      firstVisitAt,
      lastVisitAt,
      avgDaysBetweenVisits,
      daysSinceLastVisit,
    }

    const lifecycleStage = this.calculateLifecycleStage(metricsInput, tenantAvgTicket, thresholds)
    const riskLevel = this.calculateRiskLevel(daysSinceLastVisit, avgDaysBetweenVisits, thresholds)

    const ltv = firstVisitAt && lastVisitAt
      ? this.calculateLTV(totalSpent, firstVisitAt, lastVisitAt, avgDaysBetweenVisits)
      : 0

    const monthsActive = firstVisitAt
      ? Math.max(1, (Date.now() - firstVisitAt.getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 1

    const repeatVisitRate = this.calculateRepeatVisitRate(totalAppointments, monthsActive)

    const rfmScore = this.calculateRFMScore(
      daysSinceLastVisit,
      totalAppointments,
      totalSpent,
    )

    const predictedReturnDate = lastVisitAt && avgDaysBetweenVisits > 0
      ? this.calculatePredictedReturnDate(lastVisitAt, avgDaysBetweenVisits)
      : null

    // Update metrics
    await db.customerMetrics.upsert({
      where: { customerId },
      create: {
        customerId,
        tenantId: customer.tenantId,
        totalAppointments,
        totalSpent,
        avgTicket,
        firstVisitAt,
        lastVisitAt,
        avgDaysBetweenVisits,
        predictedReturnDate,
        daysSinceLastVisit,
        ltv,
        repeatVisitRate,
        rfmScore,
        recomputedAt: new Date(),
      },
      update: {
        totalAppointments,
        totalSpent,
        avgTicket,
        firstVisitAt,
        lastVisitAt,
        avgDaysBetweenVisits,
        predictedReturnDate,
        daysSinceLastVisit,
        ltv,
        repeatVisitRate,
        rfmScore,
        recomputedAt: new Date(),
      },
    })

    // Update customer lifecycle and risk
    await db.customer.update({
      where: { id: customerId },
      data: { lifecycleStage, riskLevel },
    })
  }

  // ─── Recompute all for tenant ─────────────────────────────────────────────

  async recomputeAllForTenant(
    tenantId: string,
    db: PrismaClient,
  ): Promise<{ processed: number; errors: number }> {
    const customers = await db.customer.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true },
    })

    let processed = 0
    let errors = 0

    for (const { id } of customers) {
      try {
        await this.recomputeCustomer(id, db)
        processed++
      } catch (err) {
        console.error(`[CustomerAnalytics] Error recomputing ${id}:`, err)
        errors++
      }
    }

    return { processed, errors }
  }

  // ─── Retention cohorts ────────────────────────────────────────────────────

  async computeRetentionCohort(tenantId: string, db: PrismaClient): Promise<RetentionCohort[]> {
    const cohorts: RetentionCohort[] = []

    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = endOfMonth(monthStart)
      const monthKey = monthStart.toISOString().slice(0, 7)

      // Customers who had their first appointment in this month
      const newCustomers = await db.appointment.groupBy({
        by: ['customerId'],
        where: {
          tenantId,
          status: 'COMPLETED',
          scheduledAt: { gte: monthStart, lte: monthEnd },
        },
        _count: true,
      })

      // Customers who returned in this month (had prior appointments)
      const returningCount = await db.customer.count({
        where: {
          tenantId,
          appointments: {
            some: { scheduledAt: { gte: monthStart, lte: monthEnd }, status: 'COMPLETED' },
          },
          metrics: {
            firstVisitAt: { lt: monthStart },
          },
        },
      })

      const newCount = newCustomers.length
      const retentionRate = newCount > 0 ? Math.round((returningCount / newCount) * 100) / 100 : 0

      cohorts.push({
        month: monthKey,
        newCustomers: newCount,
        returningCustomers: returningCount,
        retentionRate,
      })
    }

    return cohorts
  }
}

export const customerAnalyticsService = new CustomerAnalyticsService()
