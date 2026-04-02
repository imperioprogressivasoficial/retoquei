import IORedis from 'ioredis'
import { Queue, type ConnectionOptions } from 'bullmq'

// ─────────────────────────────────────────────
// IORedis Connection
// ─────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __redis: IORedis | undefined
}

function createRedisClient(): IORedis {
  const url = process.env.REDIS_URL

  const client = url
    ? new IORedis(url, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: false,
      })
    : new IORedis({
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD ?? undefined,
        db: parseInt(process.env.REDIS_DB ?? '0', 10),
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
      })

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err)
  })

  client.on('connect', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Redis] Connected')
    }
  })

  return client
}

// Singleton — reuse across HMR in development
export const redis = globalThis.__redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__redis = redis
}

// ─────────────────────────────────────────────
// BullMQ Shared Connection Options
// ─────────────────────────────────────────────

/**
 * BullMQ requires maxRetriesPerRequest: null on the connection.
 * We pass the same IORedis instance to all queues.
 */
const connection: ConnectionOptions = redis as unknown as ConnectionOptions

// ─────────────────────────────────────────────
// Queue Definitions
// ─────────────────────────────────────────────

/**
 * Triggered when a connector sync is requested.
 * Payload: { tenantId: string; connectorId: string; syncType: 'customers' | 'appointments' | 'services' | 'full' }
 */
export const connectorSyncQueue = new Queue('connector-sync', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
})

/**
 * Triggered after a sync to recompute metrics for a single customer.
 * Payload: { tenantId: string; customerId: string }
 */
export const customerRecomputeQueue = new Queue('customer-recompute', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
})

/**
 * Triggered to refresh segment membership for a tenant.
 * Payload: { tenantId: string; segmentId?: string } (no segmentId = refresh all)
 */
export const segmentRefreshQueue = new Queue('segment-refresh', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
})

/**
 * Triggered to send a single outbound message.
 * Payload: { messageId: string; tenantId: string }
 */
export const messageSendQueue = new Queue('message-send', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
})

/**
 * Triggered when a webhook payload arrives and needs processing.
 * Payload: { connectorId: string; tenantId: string; rawPayload: unknown; signature?: string }
 */
export const webhookProcessQueue = new Queue('webhook-process', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 2_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
})

/**
 * Triggered to schedule messages for a campaign at the defined send time.
 * Payload: { campaignId: string; tenantId: string }
 */
export const campaignScheduleQueue = new Queue('campaign-schedule', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
})

/**
 * Cron-like queue that retries messages stuck in FAILED state.
 * Payload: { tenantId?: string } (no tenantId = retry all tenants)
 */
export const retryFailedMessagesQueue = new Queue('retry-failed-messages', {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
})

// ─────────────────────────────────────────────
// Named export map (useful for workers)
// ─────────────────────────────────────────────

export const QUEUES = {
  connectorSyncQueue,
  customerRecomputeQueue,
  segmentRefreshQueue,
  messageSendQueue,
  webhookProcessQueue,
  campaignScheduleQueue,
  retryFailedMessagesQueue,
} as const

export type QueueName = keyof typeof QUEUES
