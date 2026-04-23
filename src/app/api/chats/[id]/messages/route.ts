import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/chats/[id]/messages - Get messages from a specific chat
 * POST /api/chats/[id]/messages - Send a message via Baileys WhatsApp
 *
 * Uses Baileys server running on Railway/Render for WhatsApp messaging.
 * Real-time updates via Supabase Realtime on the chat_messages table.
 */

const BAILEYS_URL = process.env.BAILEYS_SERVER_URL || 'http://localhost:3001'

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

    // Get messages (max 100)
    const messages = await prisma.chatMessage.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
      take: 100,
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
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    // Verify chat belongs to salon
    const chat = await prisma.chat.findFirst({
      where: { id, salonId: salon.id },
      include: { client: true },
    })
    if (!chat) {
      return NextResponse.json({ error: 'Chat não encontrado' }, { status: 404 })
    }

    // Get client's WhatsApp number
    const phoneNumber = chat.clientPhoneNumber || chat.client.phone

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Número WhatsApp do cliente não encontrado' },
        { status: 400 },
      )
    }

    // Check Baileys connection
    let baileyStatus
    try {
      const res = await fetch(`${BAILEYS_URL}/api/status`)
      baileyStatus = await res.json()
    } catch (err) {
      console.error('[Chat] Baileys connection check failed:', err)
      return NextResponse.json(
        { error: 'Servidor WhatsApp desconectado' },
        { status: 503 },
      )
    }

    if (!baileyStatus.connected) {
      return NextResponse.json(
        { error: 'WhatsApp não está conectado. Escaneie o QR code.' },
        { status: 503 },
      )
    }

    // Send message via Baileys
    let sendResult
    try {
      const res = await fetch(`${BAILEYS_URL}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          message: content.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Falha ao enviar')
      }

      sendResult = await res.json()
    } catch (err: any) {
      console.error('[Chat] Baileys send error:', err)
      sendResult = { success: false, error: err.message }
    }

    // Create message record
    const message = await prisma.chatMessage.create({
      data: {
        chatId: id,
        content: content.trim(),
        direction: 'outbound',
        whatsappMessageId: sendResult.messageId,
        status: sendResult.success ? 'sent' : 'failed',
        errorMessage: sendResult.error,
      },
    })

    // Update chat
    await prisma.chat.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    })

    if (!sendResult.success) {
      return NextResponse.json(
        { ...message, baileyError: sendResult.error },
        { status: 201 },
      )
    }

    return NextResponse.json(message, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/chats/[id]/messages error:', err)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
