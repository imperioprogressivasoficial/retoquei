import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// ---------------------------------------------------------------------------
// WhatsApp Inbound Edge Function
// Handles Meta WhatsApp Cloud API webhook verification and inbound events.
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  // ── GET: Webhook verification challenge ─────────────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const verifyToken = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      console.log('[whatsapp-inbound] Webhook verified')
      return new Response(challenge, { status: 200 })
    }

    return new Response('Forbidden', { status: 403 })
  }

  // ── POST: Inbound events ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    try {
      const rawBody = await req.text()
      const payload = JSON.parse(rawBody)

      if (payload.object !== 'whatsapp_business_account') {
        return new Response('Not whatsapp', { status: 400 })
      }

      // Process each entry
      for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const val = change.value

          // Resolve tenant from phone_number_id
          const phoneNumberId = val.metadata?.phone_number_id
          let tenantId: string | null = null

          if (phoneNumberId) {
            const { data } = await supabase
              .from('booking_connectors')
              .select('tenant_id, config')
              .eq('type', 'WEBHOOK')
              .filter('config->>phoneNumberId', 'eq', phoneNumberId)
              .maybeSingle()

            tenantId = data?.tenant_id ?? null
          }

          // Store inbound messages
          for (const msg of val.messages ?? []) {
            const fromNumber = '+' + msg.from

            // Find customer by phone
            let customerId: string | null = null
            if (tenantId) {
              const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('phone_e164', fromNumber)
                .maybeSingle()
              customerId = customer?.id ?? null
            }

            await supabase.from('inbound_messages').insert({
              tenant_id: tenantId,
              from_number: fromNumber,
              customer_id: customerId,
              body: msg.text?.body ?? '',
              provider_message_id: msg.id,
              channel: 'WHATSAPP',
              received_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
            })
          }

          // Update delivery statuses
          for (const status of val.statuses ?? []) {
            const statusMap: Record<string, string> = {
              sent: 'SENT',
              delivered: 'DELIVERED',
              read: 'READ',
              failed: 'FAILED',
            }
            const newStatus = statusMap[status.status]
            if (!newStatus) continue

            await supabase
              .from('outbound_messages')
              .update({
                status: newStatus,
                delivered_at: newStatus === 'DELIVERED' ? new Date().toISOString() : undefined,
                read_at: newStatus === 'READ' ? new Date().toISOString() : undefined,
              })
              .eq('provider_message_id', status.id)

            await supabase.from('message_events').insert({
              message_id: status.id,
              event_type: status.status,
              payload: status,
            })
          }
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (err) {
      console.error('[whatsapp-inbound]', err)
      return new Response(JSON.stringify({ error: 'Processing error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response('Method not allowed', { status: 405 })
})
