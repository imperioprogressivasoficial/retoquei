import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// ---------------------------------------------------------------------------
// Generic Webhook Receiver Edge Function
// Receives webhooks from external booking systems, validates signatures,
// stores events, and queues them for async processing.
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // Extract tenant from query param or header
    const url = new URL(req.url)
    const tenantId = url.searchParams.get('tenantId') ?? req.headers.get('x-tenant-id')
    const connectorId = url.searchParams.get('connectorId') ?? req.headers.get('x-connector-id')
    const idempotencyKey = req.headers.get('x-idempotency-key') ?? crypto.randomUUID()

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'tenantId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawBody = await req.text()
    const signature = req.headers.get('x-webhook-signature') ?? req.headers.get('x-hub-signature-256')

    // Validate HMAC signature if connector has a webhook secret
    if (connectorId && signature) {
      const { data: connector } = await supabase
        .from('booking_connectors')
        .select('webhook_secret')
        .eq('id', connectorId)
        .single()

      if (connector?.webhook_secret) {
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(connector.webhook_secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        )
        const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
        const expectedSig = Array.from(new Uint8Array(signatureBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

        const provided = signature.replace('sha256=', '')
        if (provided !== expectedSig) {
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
    }

    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch {
      payload = { raw: rawBody }
    }

    // Determine source
    const source = url.searchParams.get('source') ?? 'custom'
    const eventType = url.searchParams.get('eventType') ?? req.headers.get('x-event-type') ?? 'webhook'

    // Store webhook event (idempotent)
    const { error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        tenant_id: tenantId,
        source,
        event_type: eventType,
        payload,
        processed: false,
        idempotency_key: idempotencyKey,
      })

    if (insertError) {
      // Unique constraint violation = duplicate, that's fine
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ status: 'duplicate' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw new Error(insertError.message)
    }

    return new Response(JSON.stringify({ status: 'queued' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[webhook-receiver]', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
