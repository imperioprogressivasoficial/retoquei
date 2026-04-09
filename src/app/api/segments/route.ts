import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const segments = await prisma.segment.findMany({
      where: { salonId: salon.id },
      include: {
        _count: { select: { clients: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ segments })
  } catch (err) {
    console.error('GET /api/segments error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { name, description, type, rulesJson } = body

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    const segment = await prisma.segment.create({
      data: {
        salonId: salon.id,
        name,
        description: description ?? null,
        type: type ?? 'MANUAL',
        rulesJson: rulesJson ?? null,
      },
      include: {
        _count: { select: { clients: true } },
      },
    })

    return NextResponse.json({ segment }, { status: 201 })
  } catch (err) {
    console.error('POST /api/segments error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
