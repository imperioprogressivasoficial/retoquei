import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const templates = await prisma.template.findMany({
      where: { salonId: salon.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (err) {
    console.error('GET /api/templates error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { name, category, content } = body

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!content) return NextResponse.json({ error: 'Conteúdo é obrigatório' }, { status: 400 })

    const template = await prisma.template.create({
      data: {
        salonId: salon.id,
        name,
        category: category ?? 'CUSTOM',
        content,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (err) {
    console.error('POST /api/templates error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
