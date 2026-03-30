import { Queue } from 'bullmq'
import { redis } from './lib/redis'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Scheduler — registers all recurring cron jobs using BullMQ repeat
// ---------------------------------------------------------------------------

const queues = {
  connectorSync: new Queue('connector-sync', { connection: redis }),
  customerRecompute: new Queue('customer-recompute', { connection: redis }),
  segmentRefresh: new Queue('segment-refresh', { connection: redis }),
  messageSend: new Queue('message-send', { connection: redis }),
  retryFailed: new Queue('retry-failed-messages', { connection: redis }),
}

export async function setupScheduler() {
  console.log('[Scheduler] Setting up cron jobs...')

  // ── Nightly connector sync (02:00 BRT) ─────────────────────────────────────
  await queues.connectorSync.add(
    'nightly-sync-all',
    { type: 'all_tenants' },
    {
      repeat: { pattern: '0 5 * * *' }, // 02:00 BRT = 05:00 UTC
      jobId: 'nightly-sync-all',
      removeOnComplete: { count: 5 },
      removeOnFail: { count: 20 },
    },
  )

  // ── Daily customer recompute (03:00 BRT) ───────────────────────────────────
  await queues.customerRecompute.add(
    'daily-recompute-all',
    { type: 'all_tenants' },
    {
      repeat: { pattern: '0 6 * * *' }, // 03:00 BRT = 06:00 UTC
      jobId: 'daily-recompute-all',
      removeOnComplete: { count: 5 },
    },
  )

  // ── Daily segment refresh (04:00 BRT) ─────────────────────────────────────
  await queues.segmentRefresh.add(
    'daily-segment-refresh-all',
    { type: 'all_tenants' },
    {
      repeat: { pattern: '0 7 * * *' }, // 04:00 BRT = 07:00 UTC
      jobId: 'daily-segment-refresh-all',
      removeOnComplete: { count: 5 },
    },
  )

  // ── Campaign dispatch check (every 15 minutes) ─────────────────────────────
  await queues.messageSend.add(
    'dispatch-scheduled-campaigns',
    { type: 'scheduled_campaigns' },
    {
      repeat: { pattern: '*/15 * * * *' },
      jobId: 'dispatch-scheduled-campaigns',
      removeOnComplete: { count: 10 },
    },
  )

  // ── Retry failed messages (06:00 BRT) ─────────────────────────────────────
  await queues.retryFailed.add(
    'retry-failed-messages',
    { type: 'retry_all' },
    {
      repeat: { pattern: '0 9 * * *' }, // 06:00 BRT = 09:00 UTC
      jobId: 'retry-failed-messages',
      removeOnComplete: { count: 5 },
    },
  )

  console.log('[Scheduler] ✅ All cron jobs registered')
}

export async function teardownScheduler() {
  await Promise.all(Object.values(queues).map((q) => q.close()))
}
