import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { computeSegmentMembers, type SegmentRule } from '@/lib/segments/engine'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  lifecycleStages: z.array(z.string()).optional(),
  rules: z.any().optional(),
})

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

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const segments = await prisma.segment.findMany({
    where: { tenantId },
    orderBy: [{ isSystem: 'desc' }, { customerCount: 'desc' }],
  })

  return NextResponse.json(segments)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const body = await req.json()
  const result = createSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const rules = buildRules(result.data.lifecycleStages, result.data.rules)

  // Compute initial customer count
  const customerCount = Object.keys(rules).length > 0 ? await computeSegmentMembers(tenantId, rules) : 0

  const segment = await prisma.segment.create({
    data: {
      tenantId,
      name: result.data.name,
      description: result.data.description,
      type: 'CUSTOM',
      rulesJson: Object.keys(rules).length > 0 ? (rules as object) : {},
      customerCount,
      isActive: true,
      isSystem: false,
      lastComputedAt: new Date(),
    },
  })

  return NextResponse.json(segment, { status: 201 })
}
