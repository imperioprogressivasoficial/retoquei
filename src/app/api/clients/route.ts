import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const clients = await prisma.client.findMany({
      where: {
        salonId: salon.id,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ clients })
  } catch (err) {
    console.error('GET /api/clients error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { fullName, phone, email, notes } = body

    if (!fullName) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!phone) return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 })

    const phoneNormalized = normalizePhone(phone)

    const client = await prisma.client.create({
      data: {
        salonId: salon.id,
        fullName,
        phone,
        phoneNormalized,
        email: email ?? null,
        notes: notes ?? null,
        source: 'MANUAL',
        lifecycleStage: 'NEW',
      },
    })

    // Fire automation webhook (fire-and-forget)
    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/client-event`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'client.created',
          salonId: salon.id,
          clientId: client.id,
        }),
      }
    ).catch(() => {}) // Don't block response

    return NextResponse.json({ client }, { status: 201 })
  } catch (err) {
    console.error('POST /api/clients error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
