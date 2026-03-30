// ---------------------------------------------------------------------------
// Messaging Provider Interface
// All channel integrations (WhatsApp, SMS, Email) implement this.
// ---------------------------------------------------------------------------

export interface MessageResult {
  success: boolean
  providerMessageId?: string
  error?: string
}

export interface DeliveryStatus {
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending'
  timestamp?: Date
  error?: string
}

export interface InboundWebhookResult {
  events: InboundEvent[]
  errors: string[]
}

export interface InboundEvent {
  type: 'message' | 'delivery_status' | 'read' | 'failed'
  fromNumber?: string
  toNumber?: string
  messageBody?: string
  providerMessageId?: string
  status?: 'delivered' | 'read' | 'failed' | 'sent'
  timestamp: Date
  rawPayload?: unknown
}

export interface IMessagingProvider {
  readonly name: string

  /** Send a free-text message (only works in sandbox or for session messages) */
  sendTextMessage(to: string, body: string): Promise<MessageResult>

  /** Send a pre-approved template message with variable substitution */
  sendTemplateMessage(
    to: string,
    templateName: string,
    variables: Record<string, string>,
  ): Promise<MessageResult>

  /** Check the delivery status of a previously sent message */
  getDeliveryStatus(providerMessageId: string): Promise<DeliveryStatus>

  /** Parse an inbound webhook payload into normalized events */
  processInboundWebhook(payload: unknown): Promise<InboundWebhookResult>

  /** Validate Meta's webhook verification challenge */
  validateWebhookToken(token: string, challenge: string): string | null
}
