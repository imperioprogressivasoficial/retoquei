import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params

    const client = await prisma.client.findFirst({
      where: {
        id,
        salonId: salon.id,
        deletedAt: null,
      },
    })

    if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    return NextResponse.json({ client })
  } catch (err) {
    console.error('GET /api/clients/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { fullName, phone, email, notes } = body

    if (!fullName) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!phone) return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 })

    const existing = await prisma.client.findFirst({
      where: { id, salonId: salon.id, deletedAt: null },
    })
    if (!existing) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    const client = await prisma.client.update({
      where: { id },
      data: {
        fullName,
        phone,
        phoneNormalized: phone.replace(/\D/g, ''),
        email: email ?? null,
        notes: notes ?? null,
      },
    })

    return NextResponse.json({ client })
  } catch (err) {
    console.error('PUT /api/clients/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params

    const existing = await prisma.client.findFirst({
      where: { id, salonId: salon.id, deletedAt: null },
    })
    if (!existing) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    // Soft delete
    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/clients/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
