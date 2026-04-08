import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // TODO: Fix database connection and restore templates list
    return NextResponse.json({ templates: [] })
  } catch {
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

    // TODO: Fix database connection and restore template creation
    const template = {
      id: 'temp-template-' + Date.now(),
      salonId: salon.id,
      name,
      category: category ?? 'CUSTOM',
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
