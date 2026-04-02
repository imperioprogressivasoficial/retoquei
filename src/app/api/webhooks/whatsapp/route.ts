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

  console.log('[WhatsApp Webhook] Verification attempt', {
    mode,
    hasToken: !!token,
    hasChallenge: !!challenge,
  })

  const provider = getMessagingProvider()
  const valid = provider.validateWebhookToken(token ?? '', challenge ?? '')

  if (valid && mode === 'subscribe') {
    console.log('[WhatsApp Webhook] ✅ Verification successful')
    return new Response(valid, { status: 200 })
  }

  console.log('[WhatsApp Webhook] ❌ Verification failed')
  return new Response('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const idempotencyKey = req.headers.get('x-idempotency-key') ?? `wa_${Date.now()}_${Math.random().toString(36).slice(2)}`

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch (err) {
    console.error('[WhatsApp webhook] Invalid JSON:', err)
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[WhatsApp Webhook] Received event', {
    idempotencyKey,
    payloadType: typeof payload === 'object' ? Object.keys(payload as object)[0] : 'unknown',
  })

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
  const result = await provider.processInboundWebhook(payload)

  console.log('[WhatsApp Webhook] ✅ Processed', {
    eventCount: result.events.length,
    errorCount: result.errors.length,
  })

  return NextResponse.json({ status: 'ok' })
}
