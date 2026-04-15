import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const campaign = await prisma.campaign.findFirst({ where: { id, salonId: salon.id } })
    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

    await prisma.message.deleteMany({ where: { campaignId: id } })
    await prisma.campaignRecipient.deleteMany({ where: { campaignId: id } })
    await prisma.campaign.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/campaigns/[id] error:', err)
    return NextResponse.json({ error: 'Erro ao excluir campanha' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const campaign = await prisma.campaign.findFirst({ where: { id, salonId: salon.id } })
    if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

    if (body.action === 'archive') {
      await prisma.campaign.update({ where: { id }, data: { archivedAt: new Date() } })
      return NextResponse.json({ success: true })
    }
    if (body.action === 'unarchive') {
      await prisma.campaign.update({ where: { id }, data: { archivedAt: null } })
      return NextResponse.json({ success: true })
    }

    // Partial field update — only allowed when campaign is still a DRAFT
    // (prevents editing a campaign that's already running or completed)
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Só é possível editar rascunhos ou campanhas agendadas' },
        { status: 400 },
      )
    }

    const data: Record<string, any> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.segmentId !== undefined) data.segmentId = body.segmentId || null
    if (body.templateId !== undefined) data.templateId = body.templateId || null
    if (body.scheduledAt !== undefined) {
      data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
      data.status = body.scheduledAt ? 'SCHEDULED' : 'DRAFT'
    }

    // Manual content: if present, create/update the associated template
    if (body.manualContent !== undefined && body.manualContent !== null) {
      if (campaign.templateId) {
        await prisma.template.update({
          where: { id: campaign.templateId },
          data: { content: body.manualContent, name: `Campanha: ${data.name ?? campaign.name}` },
        })
      } else if (body.manualContent) {
        const template = await prisma.template.create({
          data: {
            salonId: salon.id,
            name: `Campanha: ${data.name ?? campaign.name}`,
            category: 'CUSTOM',
            content: body.manualContent,
          },
        })
        data.templateId = template.id
      }
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data,
    })

    return NextResponse.json({ campaign: updated })
  } catch (err) {
    console.error('PATCH /api/campaigns/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
