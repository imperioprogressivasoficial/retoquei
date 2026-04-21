import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WhatsAppCloudProvider } from '@/services/messaging/whatsapp-cloud.provider'

/**
 * GET /api/chats/[id]/messages - Get messages from a specific chat
 * POST /api/chats/[id]/messages - Send a message via WhatsApp
 *
 * Real-time updates via Supabase Realtime on the chat_messages table.
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

    // Get messages (max 100, most recent first for pagination)
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

    // Check if WhatsApp is configured
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'WhatsApp não configurado' },
        { status: 503 },
      )
    }

    // Get client's WhatsApp number from chat (fallback to client phone)
    const phoneNumber = chat.clientPhoneNumber || chat.client.phone

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Número WhatsApp do cliente não encontrado' },
        { status: 400 },
      )
    }

    // Initialize WhatsApp provider
    const whatsapp = new WhatsAppCloudProvider()

    // Send message via WhatsApp Cloud API
    let whatsappResult
    try {
      whatsappResult = await whatsapp.sendTextMessage(phoneNumber, content.trim())
    } catch (whatsappErr) {
      console.error('[Chat] WhatsApp send error:', whatsappErr)
      whatsappResult = { success: false, error: 'Falha ao enviar via WhatsApp' }
    }

    // Create message record in database
    const message = await prisma.chatMessage.create({
      data: {
        chatId: id,
        content: content.trim(),
        direction: 'outbound',
        whatsappMessageId: whatsappResult.providerMessageId,
        status: whatsappResult.success ? 'sent' : 'failed',
        errorMessage: whatsappResult.error,
      },
    })

    // Update chat last message
    await prisma.chat.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    })

    // If send failed, return with error but still return the message record
    if (!whatsappResult.success) {
      return NextResponse.json(
        { ...message, whatsappError: whatsappResult.error },
        { status: 201 },
      )
    }

    return NextResponse.json(message, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/chats/[id]/messages error:', err)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
