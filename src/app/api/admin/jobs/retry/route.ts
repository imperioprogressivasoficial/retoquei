import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function isAdmin(supabaseUserId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.auth.admin.getUserById(supabaseUserId)
  return data?.user?.app_metadata?.is_platform_admin === true
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await isAdmin(user.id).catch(() => false)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { jobId, queueName } = await req.json()
  if (!jobId || !queueName) {
    return NextResponse.json({ error: 'jobId e queueName são obrigatórios' }, { status: 400 })
  }

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

    const queue = new Queue(queueName, { connection })

    try {
      const job = await queue.getJob(jobId)
      if (!job) return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 })
      await job.retry()
      return NextResponse.json({ ok: true, message: `Job ${jobId} enviado para retry` })
    } finally {
      await queue.close()
      await connection.quit().catch(() => {})
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
