import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    return NextResponse.json({ segments: [] })
  } catch {
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

    const segment = {
      id: 'seg-' + Date.now(),
      salonId: salon.id,
      name,
      description: description ?? null,
      type: type ?? 'MANUAL',
      rulesJson: rulesJson ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { clients: 0 },
    }

    return NextResponse.json({ segment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
