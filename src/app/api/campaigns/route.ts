import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const campaigns = await prisma.campaign.findMany({
      where: { salonId: salon.id },
      include: {
        segment: { select: { name: true } },
        template: { select: { name: true } },
        _count: { select: { recipients: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ campaigns })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { name, segmentId, templateId, scheduledAt } = body

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    const campaign = await prisma.campaign.create({
      data: {
        salonId: salon.id,
        name,
        segmentId: segmentId ?? null,
        templateId: templateId ?? null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'DRAFT',
      },
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
