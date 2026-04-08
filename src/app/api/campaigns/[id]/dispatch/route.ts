import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // TODO: Restore campaign dispatch once database schema is deployed
    return NextResponse.json({ success: true, sentCount: 0 })
  } catch {
    return NextResponse.json({ error: 'Erro ao despachar campanha' }, { status: 500 })
  }
}
