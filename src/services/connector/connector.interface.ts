/**
 * Generic connector interface for booking/CRM integrations
 */

export type ConnectorType = 'CSV' | 'TRINKS' | 'WEBHOOK' | 'EVOLUTION'

export interface ConnectorConfig {
  [key: string]: any
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  message?: string
}

export interface ConnectorStatus {
  status: 'connected' | 'error' | 'idle'
  message: string
}

export interface SyncResult {
  success: boolean
  message: string
  customersSynced: number
  appointmentsSynced: number
  error?: string
}

export interface IConnector {
  type: ConnectorType
  connect(config: ConnectorConfig): Promise<ConnectorStatus>
  disconnect(): Promise<void>
  validateConnection(): Promise<ValidationResult>
  syncCustomers(): Promise<SyncResult>
  syncAppointments(): Promise<SyncResult>
  syncServices(): Promise<SyncResult>
  getLastSync(): Promise<Date | null>
  getSyncStatus(): Promise<any>
}
