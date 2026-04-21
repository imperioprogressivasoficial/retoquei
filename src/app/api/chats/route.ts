import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * GET /api/chats - List all chats for the current salon
 * POST /api/chats - Create or open a chat with a client
 */

export async function GET(req: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'recent' // recent, unread, name

    let query: any = {
      where: { salonId: salon.id },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            lifecycleStage: true,
          },
        },
        messages: {
          select: { content: true, createdAt: true, direction: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }

    // Apply search filter
    if (search.trim()) {
      query.where = {
        ...query.where,
        client: {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        },
      }
    }

    // Apply sorting
    if (sort === 'unread') {
      query.orderBy = { unreadCount: 'desc' }
    } else if (sort === 'name') {
      query.orderBy = [{ client: { fullName: 'asc' } }]
    } else {
      query.orderBy = { lastMessageAt: 'desc' }
    }

    const chats = await prisma.chat.findMany(query)

    return NextResponse.json({
      chats: chats.map((chat) => ({
        id: chat.id,
        client: chat.client,
        lastMessage: chat.messages[0] || null,
        unreadCount: chat.unreadCount,
        lastMessageAt: chat.lastMessageAt,
      })),
    })
  } catch (err: any) {
    console.error('GET /api/chats error:', err)
    return NextResponse.json({ error: 'Erro ao listar chats' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { clientId } = await req.json()
    if (!clientId) {
      return NextResponse.json({ error: 'clientId obrigatório' }, { status: 400 })
    }

    // Verify client belongs to salon
    const client = await prisma.client.findFirst({
      where: { id: clientId, salonId: salon.id },
    })
    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Create or get existing chat
    const chat = await prisma.chat.upsert({
      where: { salonId_clientId: { salonId: salon.id, clientId } },
      update: {},
      create: { salonId: salon.id, clientId },
      include: {
        client: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })

    return NextResponse.json(chat)
  } catch (err: any) {
    console.error('POST /api/chats error:', err)
    return NextResponse.json({ error: 'Erro ao criar chat' }, { status: 500 })
  }
}
