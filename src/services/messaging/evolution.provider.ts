// ---------------------------------------------------------------------------
// Evolution API Provider (Unofficial WhatsApp)
// Connects via QR Code — same as WhatsApp Web
// Docs: https://doc.evolution-api.com
// ---------------------------------------------------------------------------

import type {
  IMessagingProvider,
  MessageResult,
  DeliveryStatus,
  InboundWebhookResult,
} from './messaging.interface'

export class EvolutionApiProvider implements IMessagingProvider {
  readonly name = 'evolution'

  private baseUrl: string
  private apiKey: string
  private instanceName: string

  constructor() {
    this.baseUrl = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
    this.apiKey = process.env.EVOLUTION_API_KEY ?? ''
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME ?? 'retoquei'
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    }
  }

  // Format phone: add 55 country code if missing, remove all non-digits
  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    if (digits.startsWith('55')) return digits
    if (digits.length === 11 || digits.length === 10) return `55${digits}`
    return digits
  }

  async sendTextMessage(to: string, body: string): Promise<MessageResult> {
    try {
      const phone = this.formatPhone(to)
      const res = await fetch(
        `${this.baseUrl}/message/sendText/${this.instanceName}`,
        {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            number: phone,
            text: body,
          }),
        },
      )

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data?.message ?? `HTTP ${res.status}` }
      }

      return {
        success: true,
        providerMessageId: data?.key?.id ?? data?.id,
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async sendTemplateMessage(
    to: string,
    _templateName: string,
    variables: Record<string, string>,
  ): Promise<MessageResult> {
    // Evolution API doesn't use Meta templates — send as plain text
    const body = variables['body'] ?? Object.values(variables).join(' ')
    return this.sendTextMessage(to, body)
  }

  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    mediaType: string,
    caption?: string,
    fileName?: string,
  ): Promise<MessageResult> {
    try {
      const phone = this.formatPhone(to)

      // Map MIME type → Evolution mediatype
      let mediatype: 'image' | 'video' | 'document' = 'document'
      if (mediaType.startsWith('image/')) mediatype = 'image'
      else if (mediaType.startsWith('video/')) mediatype = 'video'

      const res = await fetch(
        `${this.baseUrl}/message/sendMedia/${this.instanceName}`,
        {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            number: phone,
            mediatype,
            mimetype: mediaType,
            media: mediaUrl,
            caption: caption ?? '',
            fileName: fileName ?? 'file',
          }),
        },
      )

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data?.message ?? `HTTP ${res.status}` }
      }

      return {
        success: true,
        providerMessageId: data?.key?.id ?? data?.id,
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async getDeliveryStatus(_id: string): Promise<DeliveryStatus> {
    return { status: 'sent' }
  }

  async processInboundWebhook(payload: unknown): Promise<InboundWebhookResult> {
    try {
      const p = payload as Record<string, unknown>
      const event = p?.event as string

      if (event === 'messages.upsert') {
        const msg = (p?.data as Record<string, unknown>)?.message as Record<string, unknown>
        const key = (p?.data as Record<string, unknown>)?.key as Record<string, unknown>
        const fromNumber = String(key?.remoteJid ?? '').replace('@s.whatsapp.net', '')
        const text =
          (msg?.conversation as string) ??
          ((msg?.extendedTextMessage as Record<string, unknown>)?.text as string) ??
          ''

        return {
          events: [{
            type: 'message',
            fromNumber,
            messageBody: text,
            timestamp: new Date(),
            rawPayload: payload,
          }],
          errors: [],
        }
      }

      return { events: [], errors: [] }
    } catch {
      return { events: [], errors: ['Failed to parse Evolution webhook'] }
    }
  }

  validateWebhookToken(_token: string, challenge: string): string | null {
    return challenge
  }
}

// ---------------------------------------------------------------------------
// Instance Management (QR Code, connection status)
// ---------------------------------------------------------------------------

export async function evolutionCreateInstance(instanceName: string) {
  const baseUrl = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
  const apiKey = process.env.EVOLUTION_API_KEY ?? ''

  const res = await fetch(`${baseUrl}/instance/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  })
  return res.json()
}

export async function evolutionGetQRCode(instanceName: string) {
  const baseUrl = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
  const apiKey = process.env.EVOLUTION_API_KEY ?? ''

  const res = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
    headers: { apikey: apiKey },
  })
  return res.json()
}

export async function evolutionGetStatus(instanceName: string) {
  const baseUrl = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
  const apiKey = process.env.EVOLUTION_API_KEY ?? ''

  const res = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
    headers: { apikey: apiKey },
  })
  return res.json()
}

export async function evolutionDeleteInstance(instanceName: string) {
  const baseUrl = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
  const apiKey = process.env.EVOLUTION_API_KEY ?? ''

  const res = await fetch(`${baseUrl}/instance/delete/${instanceName}`, {
    method: 'DELETE',
    headers: { apikey: apiKey },
  })
  return res.json()
}
