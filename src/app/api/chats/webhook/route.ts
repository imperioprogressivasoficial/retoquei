import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppCloudProvider } from '@/services/messaging/whatsapp-cloud.provider'

/**
 * POST /api/chats/webhook
 * Receives WhatsApp inbound messages and delivery status updates
 * Creates/updates chats and messages in real-time
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // Process each entry (webhooks can batch multiple events)
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const val = change.value

        // ────────────────────────────────────────────────────────────────
        // INBOUND MESSAGES: Store in chat system
        // ────────────────────────────────────────────────────────────────
        for (const msg of val.messages ?? []) {
          const fromNumber = `+${msg.from}`
          const salonPhoneNumberId = val.metadata?.phone_number_id

          if (!salonPhoneNumberId) continue

          try {
            // Find salon by WhatsApp phone number
            const salon = await prisma.salon.findFirst({
              where: {
                // Store phone number ID in a flexible way (environment or integration)
                // For now, we'll look up via the integration table
              },
              include: { clients: true },
            })

            // For now, we'll find the chat by phone number
            // This assumes we stored the client's WhatsApp number in Chat model
            const chat = await prisma.chat.findFirst({
              where: {
                clientPhoneNumber: fromNumber,
              },
              include: { client: true, salon: true },
            })

            if (!chat) {
              // If no chat exists, we might auto-create one by finding customer
              const customer = await prisma.client.findFirst({
                where: {
                  phone: fromNumber.replace('+', ''),
                },
              })

              if (!customer) {
                console.log(`[WhatsApp Chat] No customer found for ${fromNumber}`)
                continue
              }

              // Create new chat
              const newChat = await prisma.chat.create({
                data: {
                  salonId: customer.salonId,
                  clientId: customer.id,
                  clientPhoneNumber: fromNumber,
                  whatsappPhoneNumberId: salonPhoneNumberId,
                  isWhatsAppConnected: true,
                  messages: {
                    create: {
                      content: msg.text?.body ?? '',
                      direction: 'inbound',
                      whatsappMessageId: msg.id,
                      status: 'delivered', // Inbound messages are already delivered
                      deliveredAt: new Date(parseInt(msg.timestamp) * 1000),
                    },
                  },
                },
                include: { messages: true },
              })

              console.log(`[WhatsApp Chat] Created chat ${newChat.id} with inbound message`)
              continue
            }

            // Chat exists - add message
            const chatMessage = await prisma.chatMessage.create({
              data: {
                chatId: chat.id,
                content: msg.text?.body ?? '',
                direction: 'inbound',
                whatsappMessageId: msg.id,
                status: 'delivered',
                deliveredAt: new Date(parseInt(msg.timestamp) * 1000),
              },
            })

            // Update chat's lastMessageAt and unread count
            await prisma.chat.update({
              where: { id: chat.id },
              data: {
                lastMessageAt: new Date(parseInt(msg.timestamp) * 1000),
                unreadCount: { increment: 1 },
              },
            })

            console.log(`[WhatsApp Chat] Added inbound message to chat ${chat.id}`)
          } catch (err) {
            console.error('[WhatsApp Chat] Error processing inbound message:', err)
          }
        }

        // ────────────────────────────────────────────────────────────────
        // DELIVERY STATUS UPDATES: Update message status in real-time
        // ────────────────────────────────────────────────────────────────
        for (const status of val.statuses ?? []) {
          const messageId = status.id
          const statusMap: Record<string, string> = {
            sent: 'sent',
            delivered: 'delivered',
            read: 'read',
            failed: 'failed',
          }
          const newStatus = statusMap[status.status]

          if (!newStatus) continue

          try {
            const updateData: Record<string, any> = {
              status: newStatus,
            }

            if (newStatus === 'delivered') {
              updateData.deliveredAt = new Date(parseInt(status.timestamp) * 1000)
            } else if (newStatus === 'read') {
              updateData.readAt = new Date(parseInt(status.timestamp) * 1000)
            } else if (newStatus === 'failed') {
              updateData.failedAt = new Date(parseInt(status.timestamp) * 1000)
              if (status.errors?.[0]?.title) {
                updateData.errorMessage = status.errors[0].title
              }
            }

            const updated = await prisma.chatMessage.updateMany({
              where: { whatsappMessageId: messageId },
              data: updateData,
            })

            if (updated.count > 0) {
              console.log(
                `[WhatsApp Chat] Updated message ${messageId} status to ${newStatus}`,
              )
            }
          } catch (err) {
            console.error('[WhatsApp Chat] Error updating message status:', err)
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err) {
    console.error('[WhatsApp Chat Webhook]', err)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }
}

/**
 * GET /api/chats/webhook
 * Handles WhatsApp webhook verification challenge
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    console.log('[WhatsApp Chat] Webhook verified')
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}
