import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const client = await prisma.client.findFirst({
      where: { id, salonId: salon.id, deletedAt: null },
    })

    if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    return NextResponse.json({ client })
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
    const { fullName, phone, email, notes, whatsappOptIn } = body

    const existing = await prisma.client.findFirst({
      where: { id, salonId: salon.id, deletedAt: null },
    })
    if (!existing) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(phone ? { phone, phoneNormalized: phone.replace(/\D/g, '') } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(whatsappOptIn !== undefined ? { whatsappOptIn } : {}),
      },
    })

    return NextResponse.json({ client })
  } catch {
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

    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
