import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // TODO: Restore from database once schema is deployed
    return NextResponse.json({ messages: [] })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { toNumber, bodyRendered } = body

    if (!toNumber) return NextResponse.json({ error: 'Número é obrigatório' }, { status: 400 })
    if (!bodyRendered) return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })

    // TODO: Integrate with Evolution API to send real WhatsApp messages
    // For now, return mock success
    const message = {
      id: 'msg-' + Date.now(),
      toNumber,
      bodyRendered,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('Send message error:', err)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
