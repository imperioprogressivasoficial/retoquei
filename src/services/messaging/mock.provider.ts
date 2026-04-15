import type {
  IMessagingProvider,
  MessageResult,
  DeliveryStatus,
  InboundWebhookResult,
  InboundEvent,
} from './messaging.interface'

// ---------------------------------------------------------------------------
// Mock / Sandbox Messaging Provider
// Used in development and when WHATSAPP_MOCK_MODE=true.
// Logs messages to console, simulates delivery, never calls external APIs.
// ---------------------------------------------------------------------------

interface MockSentMessage {
  id: string
  to: string
  body: string
  templateName?: string
  variables?: Record<string, string>
  sentAt: Date
  status: 'sent' | 'delivered' | 'read' | 'failed'
}

// In-memory store for testing/inspection
const sentMessages = new Map<string, MockSentMessage>()

export class MockMessagingProvider implements IMessagingProvider {
  readonly name = 'mock'

  async sendTextMessage(to: string, body: string): Promise<MessageResult> {
    const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const msg: MockSentMessage = {
      id,
      to,
      body,
      sentAt: new Date(),
      status: 'sent',
    }
    sentMessages.set(id, msg)

    console.log(`[MockWhatsApp] ✅ Message sent`)
    console.log(`  To:   ${to}`)
    console.log(`  Body: ${body.slice(0, 80)}${body.length > 80 ? '…' : ''}`)
    console.log(`  ID:   ${id}`)

    // Simulate async delivery after 1 second
    setTimeout(() => {
      const m = sentMessages.get(id)
      if (m) {
        m.status = 'delivered'
        console.log(`[MockWhatsApp] 📬 Delivered: ${id}`)
      }
    }, 1000)

    return { success: true, providerMessageId: id }
  }

  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    mediaType: string,
    caption?: string,
    fileName?: string,
  ): Promise<MessageResult> {
    const id = `mock_media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    console.log(`[MockWhatsApp] 🖼️ Media message sent`)
    console.log(`  To:       ${to}`)
    console.log(`  Media:    ${mediaUrl} (${mediaType})`)
    console.log(`  File:     ${fileName ?? '—'}`)
    console.log(`  Caption:  ${caption ?? '—'}`)
    console.log(`  ID:       ${id}`)
    return { success: true, providerMessageId: id }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    variables: Record<string, string>,
  ): Promise<MessageResult> {
    const renderedBody = this._renderTemplate(templateName, variables)
    const id = `mock_tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const msg: MockSentMessage = {
      id,
      to,
      body: renderedBody,
      templateName,
      variables,
      sentAt: new Date(),
      status: 'sent',
    }
    sentMessages.set(id, msg)

    console.log(`[MockWhatsApp] ✅ Template message sent`)
    console.log(`  To:       ${to}`)
    console.log(`  Template: ${templateName}`)
    console.log(`  Vars:     ${JSON.stringify(variables)}`)
    console.log(`  ID:       ${id}`)

    setTimeout(() => {
      const m = sentMessages.get(id)
      if (m) m.status = 'delivered'
    }, 1000)

    return { success: true, providerMessageId: id }
  }

  async getDeliveryStatus(providerMessageId: string): Promise<DeliveryStatus> {
    const msg = sentMessages.get(providerMessageId)
    if (!msg) return { status: 'pending' }
    return { status: msg.status, timestamp: msg.sentAt }
  }

  async processInboundWebhook(payload: unknown): Promise<InboundWebhookResult> {
    // In mock mode, no real inbound webhooks come in
    return { events: [], errors: [] }
  }

  validateWebhookToken(token: string, challenge: string): string | null {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    if (token === verifyToken) return challenge
    return null
  }

  // ─── Inspection helpers (dev only) ───────────────────────────────────────

  getSentMessages(): MockSentMessage[] {
    return Array.from(sentMessages.values())
  }

  clearSentMessages(): void {
    sentMessages.clear()
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private _renderTemplate(name: string, vars: Record<string, string>): string {
    // Very basic template rendering for mock purposes
    const templates: Record<string, string> = {
      maintenance_reminder: `Olá {{first_name}}! Faz {{days_since_last_visit}} dias desde sua última visita. Que tal agendar seu {{preferred_service}}? 😊`,
      we_miss_you: `Olá {{first_name}}, sentimos sua falta em {{salon_name}}! Há {{days_since_last_visit}} dias você não nos visita. Volte e ganhe um presente especial 💛`,
      thank_you_after_visit: `Obrigada pela visita, {{first_name}}! Foi um prazer receber você em {{salon_name}}. Até a próxima! 💛`,
      birthday_message: `Feliz aniversário, {{first_name}}! 🎂 {{salon_name}} tem um presente especial para você. Venha nos visitar este mês!`,
      comeback_offer: `{{first_name}}, sua presença faz falta! Temos uma oferta especial esperando por você em {{salon_name}}.`,
    }

    let body = templates[name] ?? `Mensagem de ${name}: ${JSON.stringify(vars)}`
    for (const [key, val] of Object.entries(vars)) {
      body = body.replaceAll(`{{${key}}}`, val)
    }
    return body
  }
}
