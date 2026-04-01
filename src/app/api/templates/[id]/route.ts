import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  body: z.string().min(1).max(2000).optional(),
  category: z.string().optional(),
})

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const template = await prisma.messageTemplate.findFirst({
    where: { id: params.id, tenantId, isSystem: false },
  })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const updateData: Record<string, unknown> = { ...result.data }
  if (result.data.body) {
    updateData.variables = [...new Set((result.data.body.match(/\{\{[^}]+\}\}/g) ?? []))]
  }

  const updated = await prisma.messageTemplate.update({ where: { id: params.id }, data: updateData })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const template = await prisma.messageTemplate.findFirst({
    where: { id: params.id, tenantId, isSystem: false },
  })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.messageTemplate.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
