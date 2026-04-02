import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  customerId: z.string(),
  triggerType: z.enum(['post_service', 'segment_enter', 'manual']),
  appointmentId: z.string().optional(),
  segmentId: z.string().optional(),
})

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

/**
 * POST /api/flows/trigger
 * Manually triggers a flow for a customer
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const { customerId, triggerType, appointmentId, segmentId } = result.data

  // Verify customer belongs to this tenant
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  })
  if (!customer || customer.tenantId !== tenantId) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  try {
    const { Queue } = await import('bullmq')
    const { redis } = await import('@/lib/redis')

    const flowExecutorQueue = new Queue('flow-executor', { connection: redis })

    // Queue the flow trigger job
    if (triggerType === 'post_service' && appointmentId) {
      await flowExecutorQueue.add('trigger-post-service', {
        type: 'trigger_post_service',
        tenantId,
        customerId,
        appointmentId,
      })
    } else if (triggerType === 'segment_enter' && segmentId) {
      await flowExecutorQueue.add('trigger-segment', {
        type: 'trigger_segment',
        tenantId,
        customerId,
        segmentId,
      })
    } else if (triggerType === 'manual') {
      await flowExecutorQueue.add('trigger-manual', {
        type: 'execute_manual',
        tenantId,
        customerId,
      })
    } else {
      return NextResponse.json({ error: 'Invalid trigger type or missing required parameters' }, { status: 400 })
    }

    await flowExecutorQueue.close()
    return NextResponse.json({ success: true, message: 'Flow trigger queued' })
  } catch (err) {
    console.error('Error queueing flow trigger:', err)
    return NextResponse.json({ error: 'Failed to queue flow trigger' }, { status: 500 })
  }
}
