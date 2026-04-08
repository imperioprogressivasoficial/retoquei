import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // TODO: Restore from database once schema is deployed
    return NextResponse.json({ campaigns: [] })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { name } = body

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    // TODO: Restore to database once schema is deployed
    const campaign = {
      id: 'cmp-' + Date.now(),
      salonId: salon.id,
      name,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
