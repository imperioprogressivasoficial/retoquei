import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const template = await prisma.template.findFirst({ where: { id, salonId: salon.id } })
    if (!template) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    return NextResponse.json({ template })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, category, content } = body

    const existing = await prisma.template.findFirst({ where: { id, salonId: salon.id } })
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(category ? { category } : {}),
        ...(content ? { content } : {}),
      },
    })

    return NextResponse.json({ template })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.template.findFirst({ where: { id, salonId: salon.id } })
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    await prisma.template.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
