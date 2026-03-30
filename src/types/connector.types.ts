import type { ConnectorTypeKey } from '@/lib/constants'

// Re-export for convenience
export type ConnectorType = ConnectorTypeKey

// ─────────────────────────────────────────────
// Connector Status
// ─────────────────────────────────────────────

export type ConnectorStatus =
  | 'PENDING_SETUP'    // Created but not yet configured
  | 'ACTIVE'           // Configured and working
  | 'SYNCING'          // Currently running a sync
  | 'ERROR'            // Last sync or connection check failed
  | 'PAUSED'           // Manually paused by user
  | 'DISCONNECTED'     // Credentials revoked or expired

export const CONNECTOR_STATUS_LABELS: Record<ConnectorStatus, string> = {
  PENDING_SETUP: 'Aguardando configuração',
  ACTIVE: 'Ativo',
  SYNCING: 'Sincronizando',
  ERROR: 'Erro',
  PAUSED: 'Pausado',
  DISCONNECTED: 'Desconectado',
}

// ─────────────────────────────────────────────
// Connector (DB entity)
// ─────────────────────────────────────────────

export interface Connector {
  id: string
  tenantId: string
  type: ConnectorType
  name: string
  status: ConnectorStatus
  /** Encrypted JSON blob of connector-specific configuration */
  configEncrypted: string | null
  /** Column mapping preset ID for CSV connectors */
  columnMappingPresetId: string | null
  /** Webhook URL (for WEBHOOK type) */
  webhookUrl: string | null
  /** HMAC secret for webhook signature validation */
  webhookSecret: string | null
  /** Date of the last successful sync */
  lastSyncAt: Date | null
  /** Date of the last sync attempt */
  lastSyncAttemptAt: Date | null
  /** Error message from the last failed sync */
  lastSyncError: string | null
  /** Stats from the last sync */
  lastSyncStats: SyncStats | null
  /** Whether automatic sync is enabled */
  autoSyncEnabled: boolean
  /** Auto-sync interval in minutes */
  autoSyncIntervalMinutes: number
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Sync Results
// ─────────────────────────────────────────────

export interface SyncStats {
  customersCreated: number
  customersUpdated: number
  customersSkipped: number
  appointmentsCreated: number
  appointmentsUpdated: number
  appointmentsSkipped: number
  servicesCreated: number
  servicesUpdated: number
  servicesSkipped: number
  errors: number
}

export interface SyncResult {
  success: boolean
  stats: SyncStats
  errors: SyncError[]
  startedAt: Date
  completedAt: Date
  durationMs: number
}

export interface SyncError {
  rowIndex?: number
  externalId?: string
  entityType: 'customer' | 'appointment' | 'service'
  message: string
  data?: unknown
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  rowIndex?: number
  value?: unknown
}

export interface ValidationWarning {
  field: string
  message: string
  rowIndex?: number
  value?: unknown
}

// ─────────────────────────────────────────────
// CSV Column Mapping
// ─────────────────────────────────────────────

export type ColumnMappingTarget =
  // Customer fields
  | 'customer.name'
  | 'customer.phone'
  | 'customer.email'
  | 'customer.birthdate'
  | 'customer.notes'
  | 'customer.externalId'
  | 'customer.tags'
  // Appointment fields
  | 'appointment.customerId'
  | 'appointment.customerPhone'
  | 'appointment.customerName'
  | 'appointment.date'
  | 'appointment.time'
  | 'appointment.datetime'
  | 'appointment.serviceName'
  | 'appointment.servicePrice'
  | 'appointment.totalValue'
  | 'appointment.status'
  | 'appointment.notes'
  | 'appointment.externalId'
  // Service fields
  | 'service.name'
  | 'service.category'
  | 'service.price'
  | 'service.duration'
  | 'service.externalId'

export interface ColumnMapping {
  /** Column header in the CSV file */
  csvColumn: string
  /** Target field in our data model */
  targetField: ColumnMappingTarget
  /** Optional transformation hint */
  transform?: 'date_br' | 'date_iso' | 'phone_br' | 'currency_brl' | 'boolean' | 'trim' | 'lowercase'
  /** Whether this mapping is required */
  required: boolean
}

export interface CSVColumnMappingPreset {
  id: string
  tenantId: string | null // null = built-in preset
  name: string
  description: string | null
  /** Which entity type this preset applies to */
  entityType: 'customers' | 'appointments' | 'services'
  mappings: ColumnMapping[]
  /** Whether this is a system-provided preset */
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Webhook Connector Config
// ─────────────────────────────────────────────

export interface WebhookConnectorConfig {
  /** URL to poll (for outbound polling mode) */
  endpointUrl: string | null
  /** HTTP method for polling (default: GET) */
  pollMethod: 'GET' | 'POST'
  /** Headers to include in poll requests */
  pollHeaders: Record<string, string>
  /** Bearer token or API key for poll authentication */
  pollAuthToken: string | null
  /** How often to poll in minutes (0 = disabled, use push mode) */
  pollIntervalMinutes: number
  /** Field mapping from webhook payload to our model */
  fieldMappings: Record<string, string>
  /** HMAC algorithm for signature verification */
  signatureAlgorithm: 'sha256' | 'sha512' | null
  /** Header name where the signature is sent */
  signatureHeader: string | null
}

// ─────────────────────────────────────────────
// Trinks Connector Config
// ─────────────────────────────────────────────

export interface TrinksConnectorConfig {
  apiKey: string
  clinicId: string
  baseUrl: string
}
