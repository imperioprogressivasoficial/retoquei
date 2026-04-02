import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { computeSegmentMembers, type SegmentRule } from '@/lib/segments/engine'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  lifecycleStages: z.array(z.string()).optional(),
  rules: z.any().optional(),
  isActive: z.boolean().optional(),
})

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

function buildRules(lifecycleStages?: string[], customRules?: SegmentRule): SegmentRule {
  if (customRules) {
    return customRules
  }

  if (lifecycleStages?.length) {
    return {
      and: lifecycleStages.map((stage) => ({
        field: 'lifecycleStage',
        op: 'eq' as const,
        value: stage,
      })),
    } as any
  }

  return {} as SegmentRule
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const segment = await prisma.segment.findUnique({
    where: { id: params.id },
  })

  if (!segment || segment.tenantId !== tenantId) {
    return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
  }

  // Get segment members (customers)
  const members = await prisma.segmentMembership.findMany({
    where: { segmentId: params.id, tenantId },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          phoneE164: true,
          email: true,
          lifecycleStage: true,
          riskLevel: true,
          metrics: {
            select: {
              totalSpent: true,
              lastVisitAt: true,
              daysSinceLastVisit: true,
            },
          },
        },
      },
    },
  })

  return NextResponse.json({
    ...segment,
    members: members.map((m) => m.customer),
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const segment = await prisma.segment.findUnique({
    where: { id: params.id },
  })

  if (!segment || segment.tenantId !== tenantId) {
    return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
  }

  const body = await req.json()
  const result = updateSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const rules = buildRules(
    result.data.lifecycleStages,
    result.data.rules
  )

  // Recompute customer count if rules changed
  let customerCount = segment.customerCount
  if (result.data.lifecycleStages || result.data.rules) {
    customerCount = Object.keys(rules).length > 0 ? await computeSegmentMembers(tenantId, rules) : 0
  }

  const updated = await prisma.segment.update({
    where: { id: params.id },
    data: {
      name: result.data.name ?? segment.name,
      description: result.data.description ?? segment.description,
      rulesJson: Object.keys(rules).length > 0 ? (rules as object) : segment.rulesJson,
      customerCount,
      isActive: result.data.isActive ?? segment.isActive,
      lastComputedAt: new Date(),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const segment = await prisma.segment.findUnique({
    where: { id: params.id },
  })

  if (!segment || segment.tenantId !== tenantId) {
    return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
  }

  if (segment.isSystem) {
    return NextResponse.json({ error: 'Cannot delete system segments' }, { status: 400 })
  }

  // Delete memberships and segment
  await prisma.segmentMembership.deleteMany({
    where: { segmentId: params.id },
  })

  await prisma.segment.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
