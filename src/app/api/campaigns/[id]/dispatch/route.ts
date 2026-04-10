import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getMessagingProvider } from '@/services/messaging/messaging.factory'

/**
 * Render a template by replacing {{variable}} placeholders with client data.
 */
function renderTemplate(template: string, client: { fullName: string | null }): string {
  const firstName = (client.fullName ?? '').split(' ')[0] || 'cliente'
  return template
    .replace(/\{\{\s*nome\s*\}\}/gi, firstName)
    .replace(/\{\{\s*name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*fullName\s*\}\}/gi, client.fullName ?? 'cliente')
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const campaign = await prisma.campaign.findFirst({
      where: { id, salonId: salon.id },
      include: {
        segment: true,
        template: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    if (campaign.status === 'RUNNING' || campaign.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Campanha já foi executada' }, { status: 400 })
    }

    if (!campaign.template) {
      return NextResponse.json({ error: 'Campanha sem template' }, { status: 400 })
    }

    // Resolve the client list for this campaign.
    // If segment is DYNAMIC with {all: true}, target all active clients.
    // If segment is MANUAL, use ClientSegment relation.
    // If no segment, fall back to all opted-in clients.
    let clients: Array<{ id: string; fullName: string | null; phone: string }> = []

    if (campaign.segment) {
      const rules = campaign.segment.rulesJson as any
      const isAllClients = campaign.segment.type === 'DYNAMIC' && rules?.all === true

      if (isAllClients) {
        clients = await prisma.client.findMany({
          where: { salonId: salon.id, deletedAt: null, whatsappOptIn: true },
          select: { id: true, fullName: true, phone: true },
        })
      } else {
        const links = await prisma.clientSegment.findMany({
          where: { segmentId: campaign.segment.id },
          include: {
            client: { select: { id: true, fullName: true, phone: true, deletedAt: true, whatsappOptIn: true } },
          },
        })
        clients = links
          .filter((l) => l.client && !l.client.deletedAt && l.client.whatsappOptIn)
          .map((l) => ({ id: l.client.id, fullName: l.client.fullName, phone: l.client.phone }))
      }
    } else {
      clients = await prisma.client.findMany({
        where: { salonId: salon.id, deletedAt: null, whatsappOptIn: true },
        select: { id: true, fullName: true, phone: true },
      })
    }

    if (clients.length === 0) {
      return NextResponse.json({ error: 'Nenhum cliente para enviar' }, { status: 400 })
    }

    // Mark campaign as RUNNING
    await prisma.campaign.update({
      where: { id },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    const provider = getMessagingProvider()
    const templateContent = campaign.template.content

    let sentCount = 0
    let failedCount = 0

    for (const client of clients) {
      const rendered = renderTemplate(templateContent, client)

      // Create recipient record (idempotent on campaign+client)
      let recipient
      try {
        recipient = await prisma.campaignRecipient.create({
          data: {
            campaignId: id,
            salonId: salon.id,
            clientId: client.id,
            templateSnapshot: rendered,
            messageStatus: 'PENDING',
          },
        })
      } catch (err) {
        // Likely unique constraint; try to find existing
        recipient = await prisma.campaignRecipient.findFirst({
          where: { campaignId: id, clientId: client.id },
        })
        if (!recipient) {
          console.error(`Failed to create recipient for ${client.id}:`, err)
          failedCount++
          continue
        }
      }

      // Create message row before send so we can track it
      const message = await prisma.message.create({
        data: {
          salonId: salon.id,
          clientId: client.id,
          campaignId: id,
          templateId: campaign.templateId,
          provider: provider.name,
          direction: 'outbound',
          content: rendered,
          status: 'PENDING',
        },
      })

      // Actually send through the provider
      try {
        const result = await provider.sendTextMessage(client.phone, rendered)

        if (result.success) {
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              externalMessageId: result.providerMessageId ?? null,
            },
          })
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { messageStatus: 'SENT', sentAt: new Date() },
          })
          sentCount++
        } else {
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'FAILED',
              failedAt: new Date(),
            },
          })
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { messageStatus: 'FAILED' },
          })
          failedCount++
          console.error(`Send failed for ${client.phone}: ${result.error}`)
        }
      } catch (err: any) {
        await prisma.message.update({
          where: { id: message.id },
          data: { status: 'FAILED', failedAt: new Date() },
        })
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { messageStatus: 'FAILED' },
        })
        failedCount++
        console.error(`Send error for ${client.phone}:`, err?.message || err)
      }
    }

    // Mark campaign COMPLETED (even if some failed) or FAILED if zero sent
    await prisma.campaign.update({
      where: { id },
      data: {
        status: sentCount > 0 ? 'COMPLETED' : 'FAILED',
        finishedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      provider: provider.name,
      totalCount: clients.length,
      sentCount,
      failedCount,
    })
  } catch (err: any) {
    console.error('Campaign dispatch error:', err)

    try {
      await prisma.campaign.update({
        where: { id },
        data: { status: 'FAILED' },
      })
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: 'Erro ao despachar campanha', message: err?.message ?? 'unknown' },
      { status: 500 },
    )
  }
}
