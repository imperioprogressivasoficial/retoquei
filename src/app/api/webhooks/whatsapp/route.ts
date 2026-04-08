import { NextRequest, NextResponse } from 'next/server'

// WhatsApp Webhook - verification + inbound events
// The full processing pipeline will be implemented when WhatsApp integration is configured.

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === expectedToken && challenge) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

export async function POST(_req: NextRequest) {
  // Accept webhook events - full processing to be implemented
  return NextResponse.json({ status: 'ok' })
}
