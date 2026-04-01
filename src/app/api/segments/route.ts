import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  lifecycleStages: z.array(z.string()).optional(),
})

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const rules = result.data.lifecycleStages?.length
    ? { and: [{ field: 'lifecycle_stage', op: 'in', value: result.data.lifecycleStages }] }
    : {}

  // Compute initial customer count if rules defined
  let customerCount = 0
  if (result.data.lifecycleStages?.length) {
    customerCount = await prisma.customer.count({
      where: {
        tenantId,
        deletedAt: null,
        lifecycleStage: { in: result.data.lifecycleStages as any[] },
      },
    })
  }

  const segment = await prisma.segment.create({
    data: {
      tenantId,
      name: result.data.name,
      description: result.data.description,
      type: 'CUSTOM',
      rulesJson: rules as object,
      customerCount,
      isActive: true,
      isSystem: false,
      lastComputedAt: new Date(),
    },
  })

  return NextResponse.json(segment, { status: 201 })
}
