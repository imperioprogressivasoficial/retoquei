import { Job } from 'bullmq';
import { differenceInDays, addDays } from 'date-fns';
import { prisma } from '../lib/prisma';
import {
  segmentRefreshQueue,
  CustomerRecomputeJobData,
  SegmentRefreshJobData,
} from '../queues';
import { LifecycleStage, RiskLevel, AppointmentStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// RFM + LTV calculation helpers
// ---------------------------------------------------------------------------

/**
 * Recency score 1–5 based on days since last visit.
 * Lower days = higher score.
 */
function recencyScore(daysSince: number): number {
  if (daysSince <= 30) return 5;
  if (daysSince <= 60) return 4;
  if (daysSince <= 90) return 3;
  if (daysSince <= 180) return 2;
  return 1;
}

/**
 * Frequency score 1–5 based on total completed appointments.
 */
function frequencyScore(totalAppts: number): number {
  if (totalAppts >= 20) return 5;
  if (totalAppts >= 10) return 4;
  if (totalAppts >= 5) return 3;
  if (totalAppts >= 2) return 2;
  return 1;
}

/**
 * Monetary score 1–5 based on total spend.
 */
function monetaryScore(totalSpent: number): number {
  if (totalSpent >= 5000) return 5;
  if (totalSpent >= 2000) return 4;
  if (totalSpent >= 500) return 3;
  if (totalSpent >= 100) return 2;
  return 1;
}

/**
 * Composite RFM score (0–5 normalised).
 */
function computeRfmScore(
  daysSince: number,
  totalAppts: number,
  totalSpent: number,
): number {
  const r = recencyScore(daysSince);
  const f = frequencyScore(totalAppts);
  const m = monetaryScore(totalSpent);
  // Weighted average: recency 40%, frequency 35%, monetary 25%
  return parseFloat(((r * 0.4 + f * 0.35 + m * 0.25)).toFixed(2));
}

/**
 * LTV: simple model — average ticket × total appointments × repeat rate factor.
 */
function computeLtv(avgTicket: number, totalAppts: number, repeatRate: number): number {
  const baseValue = avgTicket * totalAppts;
  const projectedYearlyVisits = repeatRate > 0 ? 365 / repeatRate : 1;
  return parseFloat((baseValue + avgTicket * projectedYearlyVisits).toFixed(2));
}

/**
 * Determine lifecycle stage from tenant thresholds and customer metrics.
 */
function determineLifecycleStage(
  totalAppts: number,
  daysSinceLastVisit: number,
  atRiskThresholdDays: number,
  lostThresholdDays: number,
  vipAppointmentCount: number,
  avgTicket: number,
  vipAvgTicketMultiplier: number,
  tenantAvgTicket: number,
): LifecycleStage {
  const effectiveLostDays = lostThresholdDays > 0 ? lostThresholdDays : 180;
  const effectiveAtRiskDays = atRiskThresholdDays > 0 ? atRiskThresholdDays : 90;

  if (totalAppts === 0) return 'NEW';
  if (daysSinceLastVisit >= effectiveLostDays) return 'LOST';
  if (daysSinceLastVisit >= effectiveAtRiskDays) return 'AT_RISK';

  // VIP: high appointment count OR high avg ticket relative to tenant average
  const isVipByCount = totalAppts >= vipAppointmentCount;
  const isVipByTicket =
    tenantAvgTicket > 0 && avgTicket >= tenantAvgTicket * vipAvgTicketMultiplier;

  if (isVipByCount || isVipByTicket) return 'VIP';
  if (totalAppts >= 3) return 'RECURRING';
  if (totalAppts >= 1) return 'ACTIVE';
  return 'NEW';
}

/**
 * Determine risk level.
 */
function determineRiskLevel(
  daysSinceLastVisit: number,
  atRiskThresholdDays: number,
  lostThresholdDays: number,
): RiskLevel {
  const effectiveLostDays = lostThresholdDays > 0 ? lostThresholdDays : 180;
  const effectiveAtRiskDays = atRiskThresholdDays > 0 ? atRiskThresholdDays : 90;

  if (daysSinceLastVisit >= effectiveLostDays) return 'LOST';
  if (daysSinceLastVisit >= effectiveAtRiskDays) return 'HIGH';
  if (daysSinceLastVisit >= effectiveAtRiskDays * 0.6) return 'MEDIUM';
  return 'LOW';
}

// ---------------------------------------------------------------------------
// Per-customer recompute
// ---------------------------------------------------------------------------

async function recomputeCustomer(
  customerId: string,
  tenantId: string,
  tenantSettings: {
    atRiskThresholdDays: number;
    lostThresholdDays: number;
    vipAppointmentCount: number;
    vipAvgTicketMultiplier: number;
  },
  tenantAvgTicket: number,
): Promise<void> {
  const appointments = await prisma.appointment.findMany({
    where: {
      customerId,
      tenantId,
      status: { in: [AppointmentStatus.COMPLETED] },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  const now = new Date();
  const totalAppointments = appointments.length;

  if (totalAppointments === 0) {
    // Ensure a metrics record exists even with zero activity
    await prisma.customerMetrics.upsert({
      where: { customerId },
      create: {
        customerId,
        tenantId,
        totalAppointments: 0,
        totalSpent: 0,
        avgTicket: 0,
        ltv: 0,
        rfmScore: 0,
        recomputedAt: now,
      },
      update: {
        totalAppointments: 0,
        totalSpent: 0,
        avgTicket: 0,
        ltv: 0,
        rfmScore: 0,
        recomputedAt: now,
      },
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { lifecycleStage: 'NEW', riskLevel: 'LOW' },
    });
    return;
  }

  const totalSpent = appointments.reduce((sum, a) => sum + (a.price ?? 0), 0);
  const avgTicket = totalSpent / totalAppointments;
  const firstVisitAt = appointments[0].scheduledAt;
  const lastVisitAt = appointments[totalAppointments - 1].scheduledAt;
  const daysSinceLastVisit = differenceInDays(now, lastVisitAt);

  // Average days between visits (only meaningful if >= 2 visits)
  let avgDaysBetweenVisits: number | null = null;
  let predictedReturnDate: Date | null = null;
  let repeatVisitRate = 0;

  if (totalAppointments >= 2) {
    const totalDays = differenceInDays(lastVisitAt, firstVisitAt);
    avgDaysBetweenVisits = totalDays / (totalAppointments - 1);
    repeatVisitRate = avgDaysBetweenVisits;
    predictedReturnDate = addDays(lastVisitAt, Math.round(avgDaysBetweenVisits));
  }

  const rfmScore = computeRfmScore(daysSinceLastVisit, totalAppointments, totalSpent);
  const ltv = computeLtv(avgTicket, totalAppointments, repeatVisitRate);

  const lifecycleStage = determineLifecycleStage(
    totalAppointments,
    daysSinceLastVisit,
    tenantSettings.atRiskThresholdDays,
    tenantSettings.lostThresholdDays,
    tenantSettings.vipAppointmentCount,
    avgTicket,
    tenantSettings.vipAvgTicketMultiplier,
    tenantAvgTicket,
  );

  const riskLevel = determineRiskLevel(
    daysSinceLastVisit,
    tenantSettings.atRiskThresholdDays,
    tenantSettings.lostThresholdDays,
  );

  await prisma.customerMetrics.upsert({
    where: { customerId },
    create: {
      customerId,
      tenantId,
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
      recomputedAt: now,
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
      recomputedAt: now,
    },
  });

  await prisma.customer.update({
    where: { id: customerId },
    data: { lifecycleStage, riskLevel },
  });
}

// ---------------------------------------------------------------------------
// Main processor
// ---------------------------------------------------------------------------

export async function customerRecomputeProcessor(
  job: Job<CustomerRecomputeJobData>,
): Promise<void> {
  const { tenantId, customerId } = job.data;
  const log = (msg: string) =>
    console.info(`[customer-recompute] job=${job.id} tenant=${tenantId} ${msg}`);

  log(customerId ? `Recomputing customer ${customerId}` : 'Recomputing all customers');

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      atRiskThresholdDays: true,
      lostThresholdDays: true,
      vipAppointmentCount: true,
      vipAvgTicketMultiplier: true,
    },
  });

  // Compute tenant-wide average ticket for VIP classification
  const tenantMetricsAggregate = await prisma.customerMetrics.aggregate({
    where: { tenantId },
    _avg: { avgTicket: true },
  });
  const tenantAvgTicket = tenantMetricsAggregate._avg.avgTicket ?? 0;

  const tenantSettings = {
    atRiskThresholdDays: tenant.atRiskThresholdDays,
    lostThresholdDays: tenant.lostThresholdDays,
    vipAppointmentCount: tenant.vipAppointmentCount,
    vipAvgTicketMultiplier: tenant.vipAvgTicketMultiplier,
  };

  if (customerId) {
    await recomputeCustomer(customerId, tenantId, tenantSettings, tenantAvgTicket);
    log(`Recomputed customer ${customerId}`);
  } else {
    const customers = await prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true },
    });

    let processed = 0;
    let errors = 0;

    for (const customer of customers) {
      try {
        await recomputeCustomer(customer.id, tenantId, tenantSettings, tenantAvgTicket);
        processed++;
      } catch (err) {
        errors++;
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[customer-recompute] Failed to recompute customer ${customer.id}: ${message}`,
        );
      }

      // Report progress every 100 customers
      if (processed % 100 === 0) {
        await job.updateProgress(Math.round((processed / customers.length) * 100));
      }
    }

    log(`Recomputed ${processed} customers (${errors} errors)`);
  }

  // Enqueue segment refresh for this tenant
  const segmentPayload: SegmentRefreshJobData = { tenantId };
  await segmentRefreshQueue.add('refresh-after-recompute', segmentPayload, {
    jobId: `segment-refresh-${tenantId}-${Date.now()}`,
  });

  log('Enqueued segment-refresh');
}
