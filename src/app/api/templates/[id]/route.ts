import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params

    const template = await prisma.template.findFirst({
      where: { id, salonId: salon.id },
    })

    if (!template) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    return NextResponse.json({ template })
  } catch (err) {
    console.error('GET /api/templates/[id] error:', err)
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

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    const existing = await prisma.template.findFirst({
      where: { id, salonId: salon.id },
    })
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        category: category ?? existing.category,
        content: content ?? existing.content,
      },
    })

    return NextResponse.json({ template })
  } catch (err) {
    console.error('PUT /api/templates/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params

    const existing = await prisma.template.findFirst({
      where: { id, salonId: salon.id },
    })
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    await prisma.template.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/templates/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const existing = await prisma.template.findFirst({ where: { id, salonId: salon.id } })
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    if (body.action === 'archive') {
      await prisma.template.update({ where: { id }, data: { archivedAt: new Date() } })
    } else if (body.action === 'unarchive') {
      await prisma.template.update({ where: { id }, data: { archivedAt: null } })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/templates/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
