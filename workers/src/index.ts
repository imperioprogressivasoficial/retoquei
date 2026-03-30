import 'dotenv/config'
import { Worker, QueueEvents } from 'bullmq'
import { redis } from './lib/redis'
import { processConnectorSync } from './processors/connector-sync.processor'
import { processCustomerRecompute } from './processors/customer-recompute.processor'
import { processSegmentRefresh } from './processors/segment-refresh.processor'
import { processMessageSend } from './processors/message-send.processor'
import { processWebhookEvent } from './processors/webhook-process.processor'
import { setupScheduler, teardownScheduler } from './scheduler'

// ---------------------------------------------------------------------------
// Worker Entry Point
// Starts all BullMQ workers and the scheduler.
// ---------------------------------------------------------------------------

console.log('🚀 Retoquei Workers starting...')

const workers: Worker[] = []

// ── Connector Sync ──────────────────────────────────────────────────────────
workers.push(
  new Worker('connector-sync', processConnectorSync, {
    connection: redis,
    concurrency: 3,
  }),
)

// ── Customer Recompute ─────────────────────────────────────────────────────
workers.push(
  new Worker('customer-recompute', processCustomerRecompute, {
    connection: redis,
    concurrency: 2,
  }),
)

// ── Segment Refresh ────────────────────────────────────────────────────────
workers.push(
  new Worker('segment-refresh', processSegmentRefresh, {
    connection: redis,
    concurrency: 2,
  }),
)

// ── Message Send ──────────────────────────────────────────────────────────
workers.push(
  new Worker('message-send', processMessageSend, {
    connection: redis,
    concurrency: 5, // Rate limit: 5 concurrent sends
    limiter: {
      max: 50,      // Max 50 messages
      duration: 60000, // per minute (across all tenants)
    },
  }),
)

// ── Webhook Process ───────────────────────────────────────────────────────
workers.push(
  new Worker('webhook-process', processWebhookEvent, {
    connection: redis,
    concurrency: 10,
  }),
)

// ── Event logging ─────────────────────────────────────────────────────────
for (const worker of workers) {
  worker.on('completed', (job) => {
    console.log(`✅ [${worker.name}] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ [${worker.name}] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error(`💥 [${worker.name}] Worker error:`, err)
  })
}

// ── Scheduler ────────────────────────────────────────────────────────────
setupScheduler().catch((err) => {
  console.error('Failed to setup scheduler:', err)
})

// ── Health reporting ─────────────────────────────────────────────────────
setInterval(async () => {
  const stats = await Promise.all(
    workers.map(async (w) => {
      return `${w.name}: running`
    }),
  )
  console.log(`[Health] ${new Date().toISOString()} — ${stats.join(', ')}`)
}, 60_000)

// ── Graceful shutdown ─────────────────────────────────────────────────────
async function shutdown(signal: string) {
  console.log(`\n[Workers] Received ${signal}, shutting down gracefully...`)

  await teardownScheduler()
  await Promise.all(workers.map((w) => w.close()))
  await redis.quit()

  console.log('[Workers] Shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

console.log(`✅ Workers ready. Listening on ${workers.length} queues.`)
