import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const flow = await prisma.automationFlow.findFirst({
    where: { id, tenantId },
    include: {
      steps: { orderBy: { stepOrder: 'asc' } },
    },
  })

  if (!flow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(flow)
}

const stepSchema = z.object({
  id: z.string().optional(),
  stepOrder: z.number().int().min(0),
  type: z.enum(['DELAY', 'SEND_MESSAGE', 'CONDITION', 'UPDATE_CUSTOMER']),
  config: z.record(z.unknown()).optional().default({}),
})

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  triggerType: z.enum(['AFTER_APPOINTMENT', 'SEGMENT_ENTER', 'BIRTHDAY_MONTH', 'DAYS_INACTIVE', 'MANUAL']).optional(),
  triggerConfig: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
  steps: z.array(stepSchema).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const existing = await prisma.automationFlow.findFirst({ where: { id, tenantId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const result = patchSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const { steps, ...flowData } = result.data

  const updated = await prisma.$transaction(async (tx) => {
    const flow = await tx.automationFlow.update({
      where: { id },
      data: {
        ...(flowData.name !== undefined && { name: flowData.name }),
        ...(flowData.description !== undefined && { description: flowData.description }),
        ...(flowData.triggerType !== undefined && { triggerType: flowData.triggerType }),
        ...(flowData.triggerConfig !== undefined && { triggerConfig: flowData.triggerConfig as object }),
        ...(flowData.isActive !== undefined && { isActive: flowData.isActive }),
      },
    })

    if (steps !== undefined) {
      await tx.automationFlowStep.deleteMany({ where: { flowId: id } })
      if (steps.length > 0) {
        await tx.automationFlowStep.createMany({
          data: steps.map((s) => ({
            flowId: id,
            stepOrder: s.stepOrder,
            type: s.type,
            config: (s.config ?? {}) as object,
          })),
        })
      }
    }

    return tx.automationFlow.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    })
  })

  return NextResponse.json(updated)
}
