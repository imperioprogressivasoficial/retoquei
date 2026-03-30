import type {
  IMessagingProvider,
  MessageResult,
  DeliveryStatus,
  InboundWebhookResult,
  InboundEvent,
} from './messaging.interface'

// ---------------------------------------------------------------------------
// Meta WhatsApp Cloud API Provider
// Requires: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// ---------------------------------------------------------------------------

const API_VERSION = process.env.WHATSAPP_API_VERSION ?? 'v19.0'
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`

interface MetaMessageResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string; message_status: string }>
}

interface MetaWebhookEntry {
  id: string
  changes: Array<{
    value: {
      messaging_product: string
      metadata: { display_phone_number: string; phone_number_id: string }
      contacts?: Array<{ profile: { name: string }; wa_id: string }>
      messages?: Array<{
        from: string
        id: string
        timestamp: string
        type: string
        text?: { body: string }
      }>
      statuses?: Array<{
        id: string
        status: 'sent' | 'delivered' | 'read' | 'failed'
        timestamp: string
        recipient_id: string
        errors?: Array<{ code: number; title: string }>
      }>
    }
    field: string
  }>
}

export class WhatsAppCloudProvider implements IMessagingProvider {
  readonly name = 'whatsapp-cloud'

  private get phoneNumberId(): string {
    const id = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID is not configured')
    return id
  }

  private get accessToken(): string {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    if (!token) throw new Error('WHATSAPP_ACCESS_TOKEN is not configured')
    return token
  }

  async sendTextMessage(to: string, body: string): Promise<MessageResult> {
    try {
      const res = await this._post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this._normalizeNumber(to),
        type: 'text',
        text: { preview_url: false, body },
      })

      const data = res as MetaMessageResponse
      return {
        success: true,
        providerMessageId: data.messages?.[0]?.id,
      }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    variables: Record<string, string>,
  ): Promise<MessageResult> {
    // Build components from variables
    // Meta requires variables to be positional {{1}}, {{2}}, etc.
    // We map our named variables to positional order.
    const paramValues = Object.values(variables)

    const components = paramValues.length > 0
      ? [{
          type: 'body',
          parameters: paramValues.map((val) => ({ type: 'text', text: val })),
        }]
      : []

    try {
      const res = await this._post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to: this._normalizeNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components,
        },
      })

      const data = res as MetaMessageResponse
      return {
        success: true,
        providerMessageId: data.messages?.[0]?.id,
      }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async getDeliveryStatus(providerMessageId: string): Promise<DeliveryStatus> {
    // Meta Cloud API doesn't have a "get message status" endpoint —
    // status is pushed via webhooks. Return pending if not yet received.
    return { status: 'pending' }
  }

  async processInboundWebhook(payload: unknown): Promise<InboundWebhookResult> {
    const events: InboundEvent[] = []
    const errors: string[] = []

    try {
      const body = payload as { object: string; entry: MetaWebhookEntry[] }

      if (body.object !== 'whatsapp_business_account') {
        return { events: [], errors: [] }
      }

      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const val = change.value

          // Inbound messages
          for (const msg of val.messages ?? []) {
            events.push({
              type: 'message',
              fromNumber: msg.from,
              messageBody: msg.text?.body ?? '',
              providerMessageId: msg.id,
              timestamp: new Date(parseInt(msg.timestamp) * 1000),
              rawPayload: msg,
            })
          }

          // Delivery status updates
          for (const status of val.statuses ?? []) {
            const type: InboundEvent['type'] =
              status.status === 'failed' ? 'failed'
              : status.status === 'read' ? 'read'
              : 'delivery_status'

            events.push({
              type,
              providerMessageId: status.id,
              toNumber: status.recipient_id,
              status: status.status,
              timestamp: new Date(parseInt(status.timestamp) * 1000),
              rawPayload: status,
            })
          }
        }
      }
    } catch (err) {
      errors.push((err as Error).message)
    }

    return { events, errors }
  }

  validateWebhookToken(token: string, challenge: string): string | null {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    if (!verifyToken) {
      console.warn('[WhatsApp] WHATSAPP_WEBHOOK_VERIFY_TOKEN not set')
      return null
    }
    if (token === verifyToken) return challenge
    return null
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async _post(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
      throw new Error(
        (err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`,
      )
    }

    return res.json()
  }

  /** Ensure phone number is in E.164 format without the leading + */
  private _normalizeNumber(phone: string): string {
    return phone.startsWith('+') ? phone.slice(1) : phone
  }
}
