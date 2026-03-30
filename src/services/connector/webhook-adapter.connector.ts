import crypto from 'crypto'
import type { IConnector, RawCustomer, RawAppointment, RawService } from './connector.interface'
import type { ConnectorStatus, SyncResult, ValidationResult, WebhookConnectorConfig } from '@/types/connector.types'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Webhook Adapter Connector
// Generic adapter for external booking systems that can either push via
// webhooks or be polled via HTTP.
//
// TODO: Add per-system field mapping presets (e.g. a "Booksy preset")
// TODO: Add OAuth2 flow support for systems that require it
// ---------------------------------------------------------------------------

export class WebhookAdapterConnector implements IConnector {
  readonly type = 'WEBHOOK' as const

  async connect(config: Record<string, unknown>) {
    const cfg = config as WebhookConnectorConfig
    if (cfg.pollIntervalMinutes && cfg.pollIntervalMinutes > 0 && !cfg.endpointUrl) {
      return { success: false, error: 'endpointUrl é obrigatório para modo de polling' }
    }
    return { success: true }
  }

  async disconnect() {}

  async validateConnection(): Promise<ValidationResult> {
    // TODO: Attempt a test request to the configured endpoint URL if polling is enabled
    return { valid: true, errors: [], warnings: [] }
  }

  async syncCustomers(tenantId: string, connectorId: string): Promise<SyncResult> {
    const start = Date.now()
    const connector = await prisma.bookingConnector.findUnique({ where: { id: connectorId } })
    if (!connector) return this._errorSync('Connector not found')

    const config = connector.config as WebhookConnectorConfig
    if (!config.endpointUrl || config.pollIntervalMinutes === 0) {
      // Push mode — customers arrive via webhook, no pull needed
      return this._noopSync('Push mode — awaiting incoming webhooks')
    }

    try {
      const data = await this._poll(config.endpointUrl + '/customers', config)
      // TODO: Apply config.fieldMappings to transform raw payload into RawCustomer[]
      // For now, assume payload already matches our schema loosely
      const customers: RawCustomer[] = Array.isArray(data) ? data : []

      return {
        success: true,
        stats: {
          customersCreated: customers.length,
          customersUpdated: 0, customersSkipped: 0,
          appointmentsCreated: 0, appointmentsUpdated: 0, appointmentsSkipped: 0,
          servicesCreated: 0, servicesUpdated: 0, servicesSkipped: 0,
          errors: 0,
        },
        errors: [],
        startedAt: new Date(start),
        completedAt: new Date(),
        durationMs: Date.now() - start,
      }
    } catch (err) {
      return this._errorSync((err as Error).message)
    }
  }

  async syncAppointments(tenantId: string, connectorId: string): Promise<SyncResult> {
    const start = Date.now()
    const connector = await prisma.bookingConnector.findUnique({ where: { id: connectorId } })
    if (!connector) return this._errorSync('Connector not found')

    const config = connector.config as WebhookConnectorConfig
    if (!config.endpointUrl || config.pollIntervalMinutes === 0) {
      return this._noopSync('Push mode — awaiting incoming webhooks')
    }

    try {
      const data = await this._poll(config.endpointUrl + '/appointments', config)
      const appointments: RawAppointment[] = Array.isArray(data) ? data : []

      return {
        success: true,
        stats: {
          customersCreated: 0, customersUpdated: 0, customersSkipped: 0,
          appointmentsCreated: appointments.length,
          appointmentsUpdated: 0, appointmentsSkipped: 0,
          servicesCreated: 0, servicesUpdated: 0, servicesSkipped: 0,
          errors: 0,
        },
        errors: [],
        startedAt: new Date(start),
        completedAt: new Date(),
        durationMs: Date.now() - start,
      }
    } catch (err) {
      return this._errorSync((err as Error).message)
    }
  }

  async syncServices(tenantId: string, connectorId: string): Promise<SyncResult> {
    return this._noopSync('Services sync via webhook adapter not yet implemented')
  }

  async getLastSync(connectorId: string): Promise<Date | null> {
    const c = await prisma.bookingConnector.findUnique({ where: { id: connectorId } })
    return c?.lastSyncAt ?? null
  }

  async getSyncStatus(connectorId: string): Promise<ConnectorStatus> {
    const c = await prisma.bookingConnector.findUnique({ where: { id: connectorId } })
    return (c?.status as ConnectorStatus) ?? 'DISCONNECTED'
  }

  // ─── Webhook signature validation ─────────────────────────────────────────

  /** Generate a cryptographically random webhook secret for this connector */
  generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /** Validate an HMAC-SHA256 signature from an incoming webhook */
  validateWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
  ): boolean {
    try {
      const expected = crypto
        .createHmac(algorithm, secret)
        .update(rawBody, 'utf-8')
        .digest('hex')
      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
    } catch {
      return false
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async _poll(url: string, config: WebhookConnectorConfig): Promise<unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.pollHeaders,
    }
    if (config.pollAuthToken) {
      headers['Authorization'] = `Bearer ${config.pollAuthToken}`
    }

    const res = await fetch(url, {
      method: config.pollMethod ?? 'GET',
      headers,
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    }

    return res.json()
  }

  private _noopSync(reason: string): SyncResult {
    return {
      success: true,
      stats: {
        customersCreated: 0, customersUpdated: 0, customersSkipped: 0,
        appointmentsCreated: 0, appointmentsUpdated: 0, appointmentsSkipped: 0,
        servicesCreated: 0, servicesUpdated: 0, servicesSkipped: 0,
        errors: 0,
      },
      errors: [],
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
    }
  }

  private _errorSync(message: string): SyncResult {
    return {
      success: false,
      stats: {
        customersCreated: 0, customersUpdated: 0, customersSkipped: 0,
        appointmentsCreated: 0, appointmentsUpdated: 0, appointmentsSkipped: 0,
        servicesCreated: 0, servicesUpdated: 0, servicesSkipped: 0,
        errors: 1,
      },
      errors: [{ entityType: 'customer', message }],
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
    }
  }
}
