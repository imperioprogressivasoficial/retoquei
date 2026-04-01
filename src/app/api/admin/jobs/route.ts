import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const QUEUE_NAMES = [
  'connector:sync',
  'customer:recompute',
  'message:send',
  'segment:refresh',
  'webhook:process',
]

async function getQueueStats(name: string) {
  const queue = new Queue(name, {
    connection: redis as Parameters<typeof Queue>[1]['connection'],
  })
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
}

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

  const queues = await Promise.all(QUEUE_NAMES.map(getQueueStats))
  return NextResponse.json({ queues })
}
