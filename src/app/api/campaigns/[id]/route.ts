import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  segmentId: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED']).optional(),
})

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const campaign = await prisma.campaign.findFirst({
    where: { id, tenantId },
    include: {
      segment: { select: { id: true, name: true } },
      template: { select: { id: true, name: true, body: true } },
      outboundMessages: {
        select: { id: true, status: true, sentAt: true, toNumber: true },
        orderBy: { sentAt: 'desc' },
        take: 100,
      },
    },
  })

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  return NextResponse.json(campaign)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const campaign = await prisma.campaign.findFirst({
    where: { id, tenantId },
  })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  // Prevent updates to campaigns that have been sent
  if (campaign.status === 'RUNNING' || campaign.status === 'COMPLETED') {
    return NextResponse.json(
      { error: 'Cannot update a campaign that has been sent' },
      { status: 400 }
    )
  }

  const body = await req.json()
  const result = updateSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const updateData: Record<string, unknown> = {}

  if (result.data.name !== undefined) updateData.name = result.data.name
  if (result.data.segmentId !== undefined) updateData.segmentId = result.data.segmentId
  if (result.data.templateId !== undefined) updateData.templateId = result.data.templateId
  if (result.data.status !== undefined) updateData.status = result.data.status
  if (result.data.scheduledAt !== undefined) {
    updateData.scheduledAt = result.data.scheduledAt ? new Date(result.data.scheduledAt) : null
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: updateData,
    include: {
      segment: { select: { id: true, name: true } },
      template: { select: { id: true, name: true, body: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const campaign = await prisma.campaign.findFirst({
    where: { id, tenantId },
  })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  // Prevent deletion of sent campaigns
  if (campaign.status === 'RUNNING' || campaign.status === 'COMPLETED') {
    return NextResponse.json(
      { error: 'Cannot delete a campaign that has been sent' },
      { status: 400 }
    )
  }

  await prisma.campaign.delete({ where: { id, tenantId } })
  return NextResponse.json({ ok: true })
}
