import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const QUEUE_NAMES = [
  'connector:sync',
  'customer:recompute',
  'message:send',
  'segment:refresh',
  'webhook:process',
]

async function isAdmin(supabaseUserId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.auth.admin.getUserById(supabaseUserId)
  return data?.user?.app_metadata?.is_platform_admin === true
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await isAdmin(user.id).catch(() => false)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Dynamic imports to avoid build-time evaluation of BullMQ Queue constructor
    const [{ Queue }, IORedis] = await Promise.all([
      import('bullmq'),
      import('ioredis'),
    ])

    const redisUrl = process.env.REDIS_URL
    const connection = redisUrl
      ? new IORedis.default(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false, lazyConnect: true })
      : new IORedis.default({
          host: process.env.REDIS_HOST ?? '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
          password: process.env.REDIS_PASSWORD ?? undefined,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          lazyConnect: true,
        })

    const queues = await Promise.all(
      QUEUE_NAMES.map(async (name) => {
        const queue = new Queue(name, { connection })
        try {
          const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
          ])
          const recentFailed = await queue.getFailed(0, 9)
          return {
            name,
            waiting,
            active,
            completed,
            failed,
            recentFailed: recentFailed.map((j) => ({
              id: j.id,
              data: j.data as Record<string, unknown>,
              error: j.failedReason ?? 'Unknown error',
              timestamp: j.timestamp,
              attemptsMade: j.attemptsMade,
            })),
          }
        } catch (err) {
          return { name, waiting: 0, active: 0, completed: 0, failed: 0, recentFailed: [], error: (err as Error).message }
        } finally {
          await queue.close()
        }
      })
    )

    await connection.quit().catch(() => {})
    return NextResponse.json({ queues })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
