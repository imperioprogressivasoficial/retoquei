import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    return NextResponse.json({ clients: [] })
  } catch {
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

    const client = {
      id: 'cli-' + Date.now(),
      salonId: salon.id,
      fullName,
      phone,
      phoneNormalized,
      email: email ?? null,
      notes: notes ?? null,
      source: 'MANUAL',
      lifecycleStage: 'NEW',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    return NextResponse.json({ client }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
