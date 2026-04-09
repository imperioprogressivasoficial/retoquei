import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const messages = await prisma.message.findMany({
      where: { salonId: salon.id },
      include: {
        client: { select: { id: true, fullName: true, phone: true } },
        campaign: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('GET /api/messages error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { clientId, toNumber, bodyRendered, templateId, campaignId } = body

    if (!toNumber && !clientId) return NextResponse.json({ error: 'Número ou cliente é obrigatório' }, { status: 400 })
    if (!bodyRendered) return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })

    // If clientId not provided, try to find client by phone number
    let resolvedClientId = clientId
    if (!resolvedClientId && toNumber) {
      const phoneNormalized = toNumber.replace(/\D/g, '')
      const client = await prisma.client.findFirst({
        where: { salonId: salon.id, phoneNormalized, deletedAt: null },
      })
      if (client) {
        resolvedClientId = client.id
      }
    }

    if (!resolvedClientId) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Create message record in database
    const message = await prisma.message.create({
      data: {
        salonId: salon.id,
        clientId: resolvedClientId,
        campaignId: campaignId ?? null,
        templateId: templateId ?? null,
        provider: 'mock',
        direction: 'outbound',
        content: bodyRendered,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('Send message error:', err)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
