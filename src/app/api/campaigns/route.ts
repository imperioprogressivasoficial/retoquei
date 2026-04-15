import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const campaigns = await prisma.campaign.findMany({
      where: { salonId: salon.id },
      include: {
        segment: true,
        template: true,
        _count: {
          select: { recipients: true, messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ campaigns })
  } catch (err) {
    console.error('GET /api/campaigns error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    let { name, segmentId, templateId, manualContent, scheduledAt } = body

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    if (manualContent && !templateId) {
      const template = await prisma.template.create({
        data: {
          salonId: salon.id,
          name: `Campanha: ${name}`,
          category: 'CUSTOM',
          content: manualContent,
        },
      })
      templateId = template.id
    }

    const campaign = await prisma.campaign.create({
      data: {
        salonId: salon.id,
        name,
        segmentId: segmentId || undefined,
        templateId: templateId || undefined,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (err) {
    console.error('POST /api/campaigns error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
