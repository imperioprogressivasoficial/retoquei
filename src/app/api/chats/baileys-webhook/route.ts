import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/chats/baileys-webhook
 * Receives messages from Baileys WhatsApp server
 * Creates/updates chats and messages in real-time
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    const { type, from, body, messageId, timestamp } = payload

    if (type !== 'message') {
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    if (!from || !body) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    try {
      // Normalize phone number to E.164 format
      const phoneNumber = `+${from.replace(/\D/g, '')}`

      // Find chat by phone number
      // For Baileys, we need to find the first salon that has a client with this phone
      const client = await prisma.client.findFirst({
        where: {
          phone: phoneNumber.replace('+', ''),
        },
      })

      if (!client) {
        console.log(`[Baileys] No customer found for ${phoneNumber}`)
        return NextResponse.json({ status: 'ok' }, { status: 200 })
      }

      // Find or create chat
      let chat = await prisma.chat.findFirst({
        where: {
          salonId: client.salonId,
          clientId: client.id,
        },
      })

      if (!chat) {
        // Create new chat
        chat = await prisma.chat.create({
          data: {
            salonId: client.salonId,
            clientId: client.id,
            clientPhoneNumber: phoneNumber,
            isWhatsAppConnected: true,
          },
        })
        console.log(`[Baileys] Created chat ${chat.id}`)
      }

      // Create message
      const chatMessage = await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          content: body,
          direction: 'inbound',
          whatsappMessageId: messageId,
          status: 'delivered',
          deliveredAt: new Date(timestamp * 1000),
        },
      })

      // Update chat
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          lastMessageAt: new Date(timestamp * 1000),
          unreadCount: { increment: 1 },
        },
      })

      console.log(`[Baileys] Added message to chat ${chat.id}`)

      return NextResponse.json({ status: 'ok', chatId: chat.id }, { status: 200 })
    } catch (err) {
      console.error('[Baileys] Error processing message:', err)
      return NextResponse.json({ error: 'Processing error' }, { status: 500 })
    }
  } catch (err) {
    console.error('[Baileys Webhook]', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * GET /api/chats/baileys-webhook
 * Health check for Baileys server
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'baileys-webhook' }, { status: 200 })
}
