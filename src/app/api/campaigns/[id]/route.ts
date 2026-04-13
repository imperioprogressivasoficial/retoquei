import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const campaign = await prisma.campaign.findFirst({
      where: { id, salonId: salon.id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    // Delete related records first, then the campaign
    await prisma.message.deleteMany({ where: { campaignId: id } })
    await prisma.campaignRecipient.deleteMany({ where: { campaignId: id } })
    await prisma.campaign.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/campaigns/[id] error:', err)
    return NextResponse.json({ error: 'Erro ao excluir campanha' }, { status: 500 })
  }
}
