import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// GET /api/customers/[id] - Get single customer details
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, tenantId, deletedAt: null },
    include: {
      metrics: true,
      appointments: {
        include: { service: true, professional: true },
        orderBy: { scheduledAt: 'desc' },
        take: 100,
      },
      segmentMemberships: {
        include: { segment: true },
      },
      outboundMessages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  return NextResponse.json({ customer })
}

// ---------------------------------------------------------------------------
// PATCH /api/customers/[id] - Update customer
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  // Verify customer belongs to tenant
  const existingCustomer = await prisma.customer.findFirst({
    where: { id: params.id, tenantId, deletedAt: null },
  })

  if (!existingCustomer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const body = await req.json()
  const {
    fullName,
    email,
    phoneE164,
    birthdate,
    lifecycleStage,
    riskLevel,
    notes,
    tags,
    whatsappOptIn,
    preferredServiceId,
    preferredStaffId,
  } = body

  const updateData: any = {}
  if (fullName !== undefined) updateData.fullName = fullName
  if (email !== undefined) updateData.email = email
  if (phoneE164 !== undefined) updateData.phoneE164 = phoneE164
  if (birthdate !== undefined) updateData.birthdate = birthdate ? new Date(birthdate) : null
  if (lifecycleStage !== undefined) updateData.lifecycleStage = lifecycleStage
  if (riskLevel !== undefined) updateData.riskLevel = riskLevel
  if (notes !== undefined) updateData.notes = notes
  if (tags !== undefined) updateData.tags = tags
  if (whatsappOptIn !== undefined) updateData.whatsappOptIn = whatsappOptIn
  if (preferredServiceId !== undefined) updateData.preferredServiceId = preferredServiceId
  if (preferredStaffId !== undefined) updateData.preferredStaffId = preferredStaffId

  const updated = await prisma.customer.update({
    where: { id: params.id },
    data: updateData,
    include: {
      metrics: true,
      appointments: {
        include: { service: true, professional: true },
        orderBy: { scheduledAt: 'desc' },
        take: 100,
      },
      segmentMemberships: {
        include: { segment: true },
      },
    },
  })

  return NextResponse.json({ customer: updated })
}

// ---------------------------------------------------------------------------
// DELETE /api/customers/[id] - Soft delete customer
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  // Verify customer belongs to tenant
  const existingCustomer = await prisma.customer.findFirst({
    where: { id: params.id, tenantId, deletedAt: null },
  })

  if (!existingCustomer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  // Soft delete
  const deleted = await prisma.customer.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ message: 'Customer deleted', customer: deleted })
}
