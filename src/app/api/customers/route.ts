import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { tenantUsers: { take: 1 } },
  })
  const tenantId = dbUser?.tenantUsers[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const url = new URL(req.url)
  const search = url.searchParams.get('search') ?? ''
  const lifecycle = url.searchParams.get('lifecycle')
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') ?? '50')

  const where = {
    tenantId,
    deletedAt: null,
    ...(search ? {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' as const } },
        { phoneE164: { contains: search } },
      ],
    } : {}),
    ...(lifecycle ? { lifecycleStage: lifecycle as 'NEW' | 'ACTIVE' | 'RECURRING' | 'VIP' | 'AT_RISK' | 'LOST' | 'DORMANT' } : {}),
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { metrics: true },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ])

  return NextResponse.json({
    customers,
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  })
}
