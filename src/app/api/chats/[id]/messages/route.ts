import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * GET /api/chats/[id]/messages - Get messages from a specific chat
 * POST /api/chats/[id]/messages - Send a message in the chat
 */

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Verify chat belongs to salon
    const chat = await prisma.chat.findFirst({
      where: { id, salonId: salon.id },
    })
    if (!chat) {
      return NextResponse.json({ error: 'Chat não encontrado' }, { status: 404 })
    }

    // Mark as read
    await prisma.chat.update({
      where: { id },
      data: { unreadCount: 0 },
    })

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
  } catch (err: any) {
    console.error('GET /api/chats/[id]/messages error:', err)
    return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { content } = await req.json()
    if (!content) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    // Verify chat belongs to salon
    const chat = await prisma.chat.findFirst({
      where: { id, salonId: salon.id },
    })
    if (!chat) {
      return NextResponse.json({ error: 'Chat não encontrado' }, { status: 404 })
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        chatId: id,
        content: content.trim(),
        direction: 'outbound',
      },
    })

    // Update chat last message
    await prisma.chat.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/chats/[id]/messages error:', err)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
