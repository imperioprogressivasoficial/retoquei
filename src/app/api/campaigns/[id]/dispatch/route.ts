import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Find the campaign with its segment and template
    const campaign = await prisma.campaign.findFirst({
      where: { id, salonId: salon.id },
      include: {
        segment: {
          include: {
            clients: {
              include: { client: true },
            },
          },
        },
        template: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    if (campaign.status === 'RUNNING' || campaign.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Campanha já foi executada' }, { status: 400 })
    }

    // Update campaign status to RUNNING
    await prisma.campaign.update({
      where: { id },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    // Get clients from the segment, or all salon clients if no segment
    let clientIds: string[] = []

    if (campaign.segment) {
      clientIds = campaign.segment.clients.map((cs) => cs.clientId)
    } else {
      const allClients = await prisma.client.findMany({
        where: { salonId: salon.id, deletedAt: null, whatsappOptIn: true },
        select: { id: true },
      })
      clientIds = allClients.map((c) => c.id)
    }

    let sentCount = 0

    // Create campaign recipients and mock messages for each client
    for (const clientId of clientIds) {
      try {
        await prisma.campaignRecipient.create({
          data: {
            campaignId: id,
            salonId: salon.id,
            clientId,
            templateSnapshot: campaign.template?.content ?? null,
            messageStatus: 'PENDING',
          },
        })

        // Create a message record
        await prisma.message.create({
          data: {
            salonId: salon.id,
            clientId,
            campaignId: id,
            templateId: campaign.templateId ?? null,
            provider: 'mock',
            direction: 'outbound',
            content: campaign.template?.content ?? '',
            status: 'PENDING',
          },
        })

        sentCount++
      } catch (err) {
        console.error(`Failed to create recipient for client ${clientId}:`, err)
      }
    }

    // Mark campaign as completed
    await prisma.campaign.update({
      where: { id },
      data: { status: 'COMPLETED', finishedAt: new Date() },
    })

    return NextResponse.json({ success: true, sentCount })
  } catch (err) {
    console.error('Campaign dispatch error:', err)

    // Try to mark campaign as failed
    try {
      await prisma.campaign.update({
        where: { id },
        data: { status: 'FAILED' },
      })
    } catch {
      // ignore
    }

    return NextResponse.json({ error: 'Erro ao despachar campanha' }, { status: 500 })
  }
}
