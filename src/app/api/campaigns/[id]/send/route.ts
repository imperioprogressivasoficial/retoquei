import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { include: { tenant: true }, take: 1 } },
  })
  return {
    tenantId: dbUser?.ownedTenants[0]?.tenantId ?? null,
    tenantName: dbUser?.ownedTenants[0]?.tenant?.name ?? 'Salão',
  }
}

function renderBody(body: string, customer: { fullName: string; phoneE164: string }, tenantName: string) {
  const firstName = customer.fullName.split(' ')[0]
  return body
    .replace(/\{\{customer_name\}\}/g, customer.fullName)
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{salon_name\}\}/g, tenantName)
    .replace(/\{\{days_since_last_visit\}\}/g, '—')
    .replace(/\{\{preferred_service\}\}/g, '—')
    .replace(/\{\{last_visit_date\}\}/g, '—')
    .replace(/\{\{predicted_return_date\}\}/g, '—')
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tenantId, tenantName } = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, tenantId },
    include: { template: true, segment: true },
  })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (!campaign.template) return NextResponse.json({ error: 'Campaign has no template' }, { status: 400 })
  if (campaign.status === 'RUNNING' || campaign.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 })
  }

  // Mark as running
  await prisma.campaign.update({ where: { id: params.id }, data: { status: 'RUNNING', startedAt: new Date() } })

  // Get customers from segment or all customers
  let customers: { id: string; fullName: string; phoneE164: string; whatsappOptIn: boolean }[] = []
  if (campaign.segmentId) {
    const memberships = await prisma.segmentMembership.findMany({
      where: { segmentId: campaign.segmentId, tenantId },
      include: { customer: { select: { id: true, fullName: true, phoneE164: true, whatsappOptIn: true, deletedAt: true } } },
    })
    customers = memberships
      .filter((m) => !m.customer.deletedAt && m.customer.whatsappOptIn)
      .map((m) => m.customer)
  } else {
    customers = await prisma.customer.findMany({
      where: { tenantId, deletedAt: null, whatsappOptIn: true },
      select: { id: true, fullName: true, phoneE164: true, whatsappOptIn: true },
    })
  }

  // Create outbound messages (mock mode: mark as SENT immediately)
  const messages = customers.map((c) => ({
    tenantId,
    customerId: c.id,
    templateId: campaign.templateId!,
    campaignId: campaign.id,
    channel: 'WHATSAPP' as const,
    toNumber: c.phoneE164,
    bodyRendered: renderBody(campaign.template!.body, c, tenantName),
    status: 'SENT' as const,
    sentAt: new Date(),
  }))

  if (messages.length > 0) {
    await prisma.outboundMessage.createMany({ data: messages, skipDuplicates: true })
  }

  console.log(`[MOCK Campaign] Sent ${messages.length} messages for campaign "${campaign.name}"`)

  await prisma.campaign.update({
    where: { id: params.id },
    data: {
      status: 'COMPLETED',
      sentCount: messages.length,
      deliveredCount: messages.length,
      completedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, sentCount: messages.length })
}
