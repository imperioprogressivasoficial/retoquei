import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const campaign = await prisma.campaign.findFirst({
      where: { id, salonId: salon.id },
      select: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        _count: { select: { recipients: true } },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    // Count by status
    const [sent, failed, pending] = await Promise.all([
      prisma.campaignRecipient.count({ where: { campaignId: id, messageStatus: 'SENT' } }),
      prisma.campaignRecipient.count({ where: { campaignId: id, messageStatus: 'FAILED' } }),
      prisma.campaignRecipient.count({ where: { campaignId: id, messageStatus: 'PENDING' } }),
    ])

    const total = campaign._count.recipients
    const delivered = await prisma.campaignRecipient.count({
      where: { campaignId: id, messageStatus: { in: ['SENT', 'DELIVERED', 'READ'] } },
    })

    // Auto-complete campaign if all messages are processed
    if (campaign.status === 'RUNNING' && pending === 0 && total > 0) {
      await prisma.campaign.update({
        where: { id },
        data: {
          status: sent > 0 ? 'COMPLETED' : 'FAILED',
          finishedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      campaignId: id,
      status: campaign.status,
      total,
      sent,
      delivered,
      failed,
      pending,
      progress: total > 0 ? Math.round(((sent + failed) / total) * 100) : 0,
      startedAt: campaign.startedAt,
      finishedAt: campaign.finishedAt,
    })
  } catch (err: any) {
    console.error('Campaign status error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
