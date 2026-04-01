import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  triggerType: z.enum(['AFTER_APPOINTMENT', 'SEGMENT_ENTER', 'BIRTHDAY_MONTH', 'DAYS_INACTIVE', 'MANUAL']),
  triggerConfig: z.record(z.unknown()).optional(),
  activate: z.boolean().optional(),
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

  const flow = await prisma.automationFlow.create({
    data: {
      tenantId,
      name: result.data.name,
      description: result.data.description,
      triggerType: result.data.triggerType,
      triggerConfig: (result.data.triggerConfig ?? {}) as object,
      isActive: result.data.activate ?? true,
    },
  })

  return NextResponse.json(flow, { status: 201 })
}
