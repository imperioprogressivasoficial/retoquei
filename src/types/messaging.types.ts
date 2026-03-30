// ─────────────────────────────────────────────
// Message Status
// ─────────────────────────────────────────────

export type MessageStatus =
  | 'PENDING'     // Created, waiting to be queued
  | 'QUEUED'      // Added to BullMQ queue
  | 'SENT'        // Accepted by provider
  | 'DELIVERED'   // Delivered to recipient's device
  | 'READ'        // Read by recipient
  | 'FAILED'      // Provider returned an error
  | 'CANCELLED'   // Cancelled before sending

// ─────────────────────────────────────────────
// Message Template
// ─────────────────────────────────────────────

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
export type TemplateStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PAUSED'
export type TemplateChannel = 'WHATSAPP' | 'SMS' | 'EMAIL'

export interface MessageTemplate {
  id: string
  tenantId: string
  name: string
  /** Internal description (not sent to customers) */
  description: string | null
  channel: TemplateChannel
  category: TemplateCategory
  status: TemplateStatus
  /** Template body with {{variable}} placeholders */
  body: string
  /** Optional header text or media URL */
  header: string | null
  headerType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null
  /** Optional footer text */
  footer: string | null
  /** Quick reply / call-to-action buttons */
  buttons: TemplateButton[]
  /** Variables used in this template */
  variables: string[]
  /** Name used when submitting to Meta for approval */
  metaTemplateName: string | null
  /** Meta template ID after approval */
  metaTemplateId: string | null
  /** Reason for rejection (if rejected) */
  rejectionReason: string | null
  /** Example variable values for Meta submission */
  exampleVariables: Record<string, string>
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
  text: string
  /** For URL buttons */
  url?: string
  /** For phone buttons */
  phoneNumber?: string
}

// ─────────────────────────────────────────────
// Outbound Message
// ─────────────────────────────────────────────

export interface OutboundMessage {
  id: string
  tenantId: string
  customerId: string | null
  /** Campaign that triggered this message (if any) */
  campaignId: string | null
  /** Template used (if any) */
  templateId: string | null
  channel: TemplateChannel
  /** Destination phone in E.164 */
  toPhone: string
  /** Resolved message body (variables already interpolated) */
  body: string
  status: MessageStatus
  /** Provider-assigned message ID */
  providerMessageId: string | null
  /** Number of send attempts */
  attempts: number
  /** Error message from the last failed attempt */
  lastError: string | null
  /** Scheduled send time (null = send immediately) */
  scheduledAt: Date | null
  /** Timestamp when the message was accepted by the provider */
  sentAt: Date | null
  /** Timestamp when provider confirmed delivery */
  deliveredAt: Date | null
  /** Timestamp when provider confirmed the message was read */
  readAt: Date | null
  /** Timestamp when the message failed definitively */
  failedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Message Variables
// ─────────────────────────────────────────────

export type MessageVariables = {
  name?: string
  full_name?: string
  last_visit_date?: string
  days_since_last?: string
  next_predicted_date?: string
  avg_ticket?: string
  total_visits?: string
  last_service?: string
  clinic_name?: string
  phone?: string
  birthday?: string
  [key: string]: string | undefined
}

// ─────────────────────────────────────────────
// WhatsApp Config
// ─────────────────────────────────────────────

export interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  /** API version (default: v19.0) */
  apiVersion?: string
  /** Webhook verify token */
  webhookVerifyToken?: string
}

// ─────────────────────────────────────────────
// Provider result types
// ─────────────────────────────────────────────

export interface MessageResult {
  success: boolean
  providerMessageId: string | null
  error?: string
  errorCode?: string | number
}

export type DeliveryStatus =
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'DELETED'
  | 'UNKNOWN'

export interface InboundWebhookResult {
  /** Message IDs whose status was updated */
  updatedMessageIds: string[]
  /** Inbound messages received from customers */
  inboundMessages: InboundMessage[]
  /** Raw events for logging */
  rawEvents: unknown[]
}

export interface InboundMessage {
  from: string        // E.164 phone number
  body: string
  messageId: string   // Provider message ID
  timestamp: Date
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'reaction' | 'unknown'
}

// ─────────────────────────────────────────────
// Campaign
// ─────────────────────────────────────────────

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'

export interface Campaign {
  id: string
  tenantId: string
  name: string
  description: string | null
  templateId: string
  channel: TemplateChannel
  status: CampaignStatus
  /** Target segment IDs */
  segmentIds: string[]
  /** Total number of recipients at schedule time */
  recipientCount: number | null
  /** Custom variable overrides */
  variables: MessageVariables
  /** Scheduled send date/time */
  scheduledAt: Date | null
  /** Actual start time */
  startedAt: Date | null
  /** Completion time */
  completedAt: Date | null
  /** Stats */
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  createdAt: Date
  updatedAt: Date
}
