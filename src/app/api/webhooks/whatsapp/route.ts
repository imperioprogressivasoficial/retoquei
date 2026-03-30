import { NextRequest, NextResponse } from 'next/server'
import { getMessagingProvider } from '@/services/messaging/messaging.factory'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// WhatsApp Webhook — verification + inbound events
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  const provider = getMessagingProvider()
  const valid = provider.validateWebhookToken(token ?? '', challenge ?? '')

  if (valid && mode === 'subscribe') {
    return new Response(valid, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const idempotencyKey = req.headers.get('x-idempotency-key') ?? `wa_${Date.now()}_${Math.random().toString(36).slice(2)}`

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Store as webhook event for async processing
  try {
    await prisma.webhookEvent.create({
      data: {
        source: 'whatsapp',
        eventType: 'inbound',
        payload: payload as object,
        processed: false,
        idempotencyKey,
      },
    })
  } catch (err: unknown) {
    // Unique constraint = duplicate, ignore
    if ((err as { code?: string }).code !== 'P2002') {
      console.error('[WhatsApp webhook] DB error:', err)
    }
  }

  // Also process delivery status updates synchronously (fast path)
  const provider = getMessagingProvider()
  await provider.processInboundWebhook(payload)

  return NextResponse.json({ status: 'ok' })
}
