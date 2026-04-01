import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['MANAGER', 'STAFF']),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null
  const tenantRole = dbUser?.ownedTenants[0]?.role
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })
  if (tenantRole !== 'OWNER' && tenantRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  // Look up target user by email
  const targetUser = await prisma.user.findUnique({ where: { email: result.data.email } })
  if (!targetUser) {
    return NextResponse.json({
      error: 'Usuário não encontrado. Peça para ele criar uma conta no Retoquei primeiro.',
    }, { status: 404 })
  }

  // Check not already a member
  const existing = await prisma.tenantUser.findFirst({
    where: { tenantId, userId: targetUser.id },
  })
  if (existing) return NextResponse.json({ error: 'Usuário já é membro deste salão' }, { status: 409 })

  const member = await prisma.tenantUser.create({
    data: {
      tenantId,
      userId: targetUser.id,
      role: result.data.role,
      invitedAt: new Date(),
      joinedAt: new Date(),
    },
    include: { user: true },
  })

  return NextResponse.json(member, { status: 201 })
}
