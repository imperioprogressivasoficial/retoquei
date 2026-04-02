import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  body: z.string().min(1).max(2000),
  category: z.enum(['POST_SERVICE', 'RECOVERY', 'BIRTHDAY', 'PROMOTIONAL', 'CUSTOM']).optional(),
})

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)

  const templates = await prisma.messageTemplate.findMany({
    where: tenantId ? { OR: [{ tenantId }, { isSystem: true }] } : { isSystem: true },
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ templates })
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

  const variables = [...new Set((result.data.body.match(/\{\{[^}]+\}\}/g) ?? []))]

  const template = await prisma.messageTemplate.create({
    data: {
      tenantId,
      name: result.data.name,
      body: result.data.body,
      category: result.data.category ?? 'CUSTOM',
      variables,
      isSystem: false,
    },
  })
  return NextResponse.json(template, { status: 201 })
}
