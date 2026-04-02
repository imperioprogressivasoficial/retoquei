import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// GET /api/customers - List all customers (paginated, filterable, searchable)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
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

// ---------------------------------------------------------------------------
// POST /api/customers - Create new customer
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const body = await req.json()
  const {
    fullName,
    phoneE164,
    email,
    birthdate,
    lifecycleStage = 'NEW',
    riskLevel = 'LOW',
    notes,
    tags = [],
    whatsappOptIn = true,
    preferredServiceId,
    preferredStaffId,
  } = body

  if (!fullName || !phoneE164) {
    return NextResponse.json(
      { error: 'fullName and phoneE164 are required' },
      { status: 400 }
    )
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        fullName,
        normalizedName: fullName.toLowerCase().trim(),
        phoneE164,
        email: email || null,
        birthdate: birthdate ? new Date(birthdate) : null,
        lifecycleStage,
        riskLevel,
        notes: notes || null,
        tags,
        whatsappOptIn,
        preferredServiceId: preferredServiceId || null,
        preferredStaffId: preferredStaffId || null,
        metrics: {
          create: {
            tenantId,
          },
        },
      },
      include: { metrics: true },
    })

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists in this workspace' },
        { status: 409 }
      )
    }
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
