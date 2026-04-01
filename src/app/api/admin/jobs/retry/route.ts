import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

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

  const queue = new Queue(queueName, {
    connection: redis as Parameters<typeof Queue>[1]['connection'],
  })

  try {
    const job = await queue.getJob(jobId)
    if (!job) return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 })
    await job.retry()
    return NextResponse.json({ ok: true, message: `Job ${jobId} enviado para retry` })
  } finally {
    await queue.close()
  }
}
