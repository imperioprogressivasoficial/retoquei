import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const campaign = await prisma.campaign.findFirst({
      where: { id, salonId: salon.id },
      include: {
        segment: {
          include: {
            clients: { include: { client: true } },
          },
        },
        template: true,
      },
    })

    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Campanha não pode ser despachada neste estado' }, { status: 400 })
    }

    // Get clients for this campaign
    const clients = campaign.segment
      ? campaign.segment.clients.map((cs) => cs.client)
      : await prisma.client.findMany({
          where: { salonId: salon.id, deletedAt: null, whatsappOptIn: true },
          take: 1000,
        })

    const templateContent = campaign.template?.content ?? ''

    // Update campaign status to RUNNING
    await prisma.campaign.update({
      where: { id },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    let sentCount = 0
    for (const client of clients) {
      const personalizedContent = templateContent.replace(/\{\{nome\}\}/gi, client.fullName)

      await prisma.campaignRecipient.create({
        data: {
          campaignId: id,
          salonId: salon.id,
          clientId: client.id,
          templateSnapshot: personalizedContent,
          messageStatus: 'SENT',
          sentAt: new Date(),
        },
      })

      await prisma.message.create({
        data: {
          salonId: salon.id,
          clientId: client.id,
          campaignId: id,
          templateId: campaign.templateId ?? null,
          content: personalizedContent,
          status: 'SENT',
          sentAt: new Date(),
          provider: 'mock',
          direction: 'outbound',
        },
      })

      sentCount++
    }

    // Mark campaign completed
    await prisma.campaign.update({
      where: { id },
      data: { status: 'COMPLETED', finishedAt: new Date() },
    })

    return NextResponse.json({ success: true, sentCount })
  } catch {
    await prisma.campaign.update({
      where: { id },
      data: { status: 'FAILED' },
    }).catch(() => {})
    return NextResponse.json({ error: 'Erro ao despachar campanha' }, { status: 500 })
  }
}
