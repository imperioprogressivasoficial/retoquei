import type { ConnectorStatus, ConnectorType, SyncResult, ValidationResult } from '@/types/connector.types'

// ---------------------------------------------------------------------------
// Core connector interface — every booking system integration must implement this
// ---------------------------------------------------------------------------

export interface IConnector {
  readonly type: ConnectorType

  /** Persist configuration and mark connector as CONNECTED */
  connect(config: Record<string, unknown>): Promise<{ success: boolean; error?: string }>

  /** Mark connector as DISCONNECTED and clean up */
  disconnect(): Promise<void>

  /** Test the connection without persisting anything */
  validateConnection(): Promise<ValidationResult>

  /** Import / sync customers from the source system */
  syncCustomers(tenantId: string, connectorId: string): Promise<SyncResult>

  /** Import / sync appointment history */
  syncAppointments(tenantId: string, connectorId: string): Promise<SyncResult>

  /** Import / sync service catalog */
  syncServices(tenantId: string, connectorId: string): Promise<SyncResult>

  /** Timestamp of the last successful sync */
  getLastSync(connectorId: string): Promise<Date | null>

  /** Current operational status */
  getSyncStatus(connectorId: string): Promise<ConnectorStatus>
}

// ---------------------------------------------------------------------------
// Common data shapes returned by connectors before they are persisted
// ---------------------------------------------------------------------------

export interface RawCustomer {
  externalId?: string
  fullName: string
  phone: string
  email?: string
  birthdate?: string // ISO date string
  preferredService?: string
  preferredProfessional?: string
  notes?: string
  tags?: string[]
}

export interface RawAppointment {
  externalId?: string
  customerPhone: string
  customerExternalId?: string
  professionalName?: string
  serviceName?: string
  scheduledAt: string // ISO datetime
  completedAt?: string
  status: 'completed' | 'scheduled' | 'cancelled' | 'no_show'
  price?: number
  branchName?: string
  notes?: string
}

export interface RawService {
  externalId?: string
  name: string
  category?: string
  avgPrice?: number
}
