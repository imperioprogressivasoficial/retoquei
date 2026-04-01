import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendMessage as sendEvolutionMessage, isEvolutionApiConfigured } from '@/services/whatsapp-qr.service'

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

function renderBody(
  body: string,
  customer: { fullName: string; phoneE164: string },
  tenantName: string,
  metrics?: { daysSinceLastVisit?: number | null; lastVisitAt?: Date | null; predictedReturnDate?: Date | null } | null,
) {
  const firstName = customer.fullName.split(' ')[0]
  const daysSince = metrics?.daysSinceLastVisit ?? null
  const lastVisit = metrics?.lastVisitAt
    ? new Date(metrics.lastVisitAt).toLocaleDateString('pt-BR')
    : '—'
  const predictedReturn = metrics?.predictedReturnDate
    ? new Date(metrics.predictedReturnDate).toLocaleDateString('pt-BR')
    : '—'

  return body
    .replace(/\{\{customer_name\}\}/g, customer.fullName)
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{salon_name\}\}/g, tenantName)
    .replace(/\{\{days_since_last_visit\}\}/g, daysSince !== null ? String(daysSince) : '—')
    .replace(/\{\{preferred_service\}\}/g, '—')
    .replace(/\{\{last_visit_date\}\}/g, lastVisit)
    .replace(/\{\{predicted_return_date\}\}/g, predictedReturn)
}

const isMock = process.env.WHATSAPP_MOCK_MODE === 'true'
const hasMetaCredentials = Boolean(
  process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
)

async function sendWhatsAppMessage(tenantId: string, to: string, body: string): Promise<boolean> {
  // Priority: 1) Evolution API (QR code), 2) Meta Cloud API, 3) Mock
  if (isEvolutionApiConfigured()) {
    return sendEvolutionMessage(tenantId, to, body)
  }

  if (hasMetaCredentials && !isMock) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION ?? 'v19.0'}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace('+', ''),
            type: 'text',
            text: { body },
          }),
        }
      )
      return res.ok
    } catch {
      return false
    }
  }

  // Mock mode
  console.log(`[MOCK WhatsApp] → ${to}: ${body}`)
  return true
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tenantId, tenantName } = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const campaign = await prisma.campaign.findFirst({
    where: { id, tenantId },
    include: { template: true, segment: true },
  })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (!campaign.template) return NextResponse.json({ error: 'Campaign has no template' }, { status: 400 })
  if (campaign.status === 'RUNNING' || campaign.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 })
  }

  await prisma.campaign.update({ where: { id }, data: { status: 'RUNNING', startedAt: new Date() } })

  // Get customers
  let customers: {
    id: string
    fullName: string
    phoneE164: string
    whatsappOptIn: boolean
    metrics: { daysSinceLastVisit: number | null; lastVisitAt: Date | null; predictedReturnDate: Date | null } | null
  }[] = []

  if (campaign.segmentId) {
    const memberships = await prisma.segmentMembership.findMany({
      where: { segmentId: campaign.segmentId, tenantId },
      include: {
        customer: {
          select: {
            id: true, fullName: true, phoneE164: true, whatsappOptIn: true, deletedAt: true,
            metrics: { select: { daysSinceLastVisit: true, lastVisitAt: true, predictedReturnDate: true } },
          },
        },
      },
    })
    customers = memberships
      .filter((m) => !m.customer.deletedAt && m.customer.whatsappOptIn)
      .map((m) => ({ ...m.customer, metrics: m.customer.metrics }))
  } else {
    customers = await prisma.customer.findMany({
      where: { tenantId, deletedAt: null, whatsappOptIn: true },
      select: {
        id: true, fullName: true, phoneE164: true, whatsappOptIn: true,
        metrics: { select: { daysSinceLastVisit: true, lastVisitAt: true, predictedReturnDate: true } },
      },
    })
  }

  let sentCount = 0
  let failedCount = 0

  for (const customer of customers) {
    const renderedBody = renderBody(campaign.template.body, customer, tenantName, customer.metrics)
    const ok = await sendWhatsAppMessage(tenantId, customer.phoneE164, renderedBody)

    await prisma.outboundMessage.create({
      data: {
        tenantId,
        customerId: customer.id,
        templateId: campaign.templateId!,
        campaignId: campaign.id,
        channel: 'WHATSAPP',
        toNumber: customer.phoneE164,
        bodyRendered: renderedBody,
        status: ok ? 'SENT' : 'FAILED',
        sentAt: ok ? new Date() : undefined,
      },
    })

    if (ok) sentCount++
    else failedCount++

    // Respect rate limit ~50/min
    if (customers.length > 10) {
      await new Promise((r) => setTimeout(r, 1200))
    }
  }

  await prisma.campaign.update({
    where: { id },
    data: { status: 'COMPLETED', sentCount, deliveredCount: sentCount, completedAt: new Date() },
  })

  const mode = isEvolutionApiConfigured()
    ? 'Evolution API (QR)'
    : hasMetaCredentials && !isMock
    ? 'Meta Cloud API'
    : 'Mock'

  return NextResponse.json({ ok: true, sentCount, failedCount, mode })
}
