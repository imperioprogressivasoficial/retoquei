import type { IConnector, RawCustomer, RawAppointment, RawService } from './connector.interface'
import type { ConnectorStatus, SyncResult, ValidationResult, TrinksConnectorConfig } from '@/types/connector.types'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Trinks Connector — STUB / PLACEHOLDER
//
// Trinks is a popular Brazilian salon management & scheduling platform.
// This connector is a complete stub ready for the official API integration.
//
// TODO: Obtain official Trinks API credentials and documentation.
// TODO: Implement OAuth2 authentication flow with Trinks.
// TODO: Replace all mock data returns with real API calls.
// TODO: Implement webhook registration to receive real-time appointment updates.
// TODO: Map Trinks customer/appointment model to our internal model.
//
// TRINKS API CONTRACT (expected, based on common patterns):
//   Base URL:   https://api.trinks.com/v1
//   Auth:       Bearer token (OAuth2 client_credentials or user token)
//   Endpoints:
//     GET /clinics/{clinicId}/clients          — list customers
//     GET /clinics/{clinicId}/appointments     — list appointments (paginated, date filter)
//     GET /clinics/{clinicId}/services         — list services
//     POST /webhooks                           — register webhook endpoint
//   Rate limits: ~100 req/min (estimate)
//
// When credentials become available, set TRINKS_MOCK_MODE=false and fill in config.
// ---------------------------------------------------------------------------

const MOCK_MODE = process.env.TRINKS_MOCK_MODE !== 'false'

export class TrinksConnector implements IConnector {
  readonly type = 'TRINKS' as const

  async connect(config: Record<string, unknown>) {
    const cfg = config as TrinksConnectorConfig

    if (!cfg.apiKey || !cfg.clinicId) {
      return { success: false, error: 'API Key e Clinic ID são obrigatórios' }
    }

    if (MOCK_MODE) {
      console.log('[TrinksConnector] MOCK MODE — simulating successful connection')
      return { success: true }
    }

    // TODO: Call Trinks API to verify credentials
    // const res = await fetch(`${cfg.baseUrl}/clinics/${cfg.clinicId}`, {
    //   headers: { Authorization: `Bearer ${cfg.apiKey}` },
    // })
    // if (!res.ok) return { success: false, error: `Trinks API error: ${res.status}` }
    return { success: true }
  }

  async disconnect() {
    // TODO: Deregister webhook on Trinks side if registered
  }

  async validateConnection(): Promise<ValidationResult> {
    if (MOCK_MODE) {
      return { valid: true, errors: [], warnings: [
        { field: 'mock', message: 'Trinks connector está em modo mock. Configure TRINKS_MOCK_MODE=false para usar a API real.' },
      ]}
    }

    // TODO: Make a lightweight API call to verify the connection is still valid
    return { valid: true, errors: [], warnings: [] }
  }

  async syncCustomers(tenantId: string, connectorId: string): Promise<SyncResult> {
    const start = Date.now()

    if (MOCK_MODE) {
      const mockCustomers = this._generateMockCustomers(20)
      console.log(`[TrinksConnector] MOCK — returning ${mockCustomers.length} customers`)
      return {
        success: true,
        stats: {
          customersCreated: mockCustomers.length, customersUpdated: 0, customersSkipped: 0,
          appointmentsCreated: 0, appointmentsUpdated: 0, appointmentsSkipped: 0,
          servicesCreated: 0, servicesUpdated: 0, servicesSkipped: 0,
          errors: 0,
        },
        errors: [],
        startedAt: new Date(start),
        completedAt: new Date(),
        durationMs: Date.now() - start,
      }
    }

    // TODO: Implement real Trinks customer sync
    // const cfg = await this._getConfig(connectorId)
    // const res = await fetch(`${cfg.baseUrl}/clinics/${cfg.clinicId}/clients`, {
    //   headers: { Authorization: `Bearer ${cfg.apiKey}` },
    // })
    // const data = await res.json()
    // const customers = data.clients.map(this._mapTrinksClient)
    // ... persist to DB

    return this._notImplemented('syncCustomers')
  }

  async syncAppointments(tenantId: string, connectorId: string): Promise<SyncResult> {
    const start = Date.now()

    if (MOCK_MODE) {
      const mockCount = 50
      console.log(`[TrinksConnector] MOCK — returning ${mockCount} appointments`)
      return {
        success: true,
        stats: {
          customersCreated: 0, customersUpdated: 0, customersSkipped: 0,
          appointmentsCreated: mockCount, appointmentsUpdated: 0, appointmentsSkipped: 0,
          servicesCreated: 0, servicesUpdated: 0, servicesSkipped: 0,
          errors: 0,
        },
        errors: [],
        startedAt: new Date(start),
        completedAt: new Date(),
        durationMs: Date.now() - start,
      }
    }

    // TODO: GET /clinics/{clinicId}/appointments?from=...&to=...
    return this._notImplemented('syncAppointments')
  }

  async syncServices(tenantId: string, connectorId: string): Promise<SyncResult> {
    if (MOCK_MODE) {
      return this._noopSync('Mock mode — services not synced')
    }
    // TODO: GET /clinics/{clinicId}/services
    return this._notImplemented('syncServices')
  }

  async getLastSync(connectorId: string): Promise<Date | null> {
    const c = await prisma.bookingConnector.findUnique({ where: { id: connectorId } })
    return c?.lastSyncAt ?? null
  }

  async getSyncStatus(connectorId: string): Promise<ConnectorStatus> {
    const c = await prisma.bookingConnector.findUnique({ where: { id: connectorId } })
    return (c?.status as ConnectorStatus) ?? 'DISCONNECTED'
  }

  // ─── TODO: Field mapping ──────────────────────────────────────────────────
  // private _mapTrinksClient(client: TrinksClient): RawCustomer {
  //   return {
  //     externalId: String(client.id),
  //     fullName: client.name,
  //     phone: client.phone,
  //     email: client.email,
  //     birthdate: client.birthday,
  //   }
  // }

  // ─── Mock data generators ─────────────────────────────────────────────────

  private _generateMockCustomers(count: number): RawCustomer[] {
    const names = ['Ana Silva', 'Maria Santos', 'Fernanda Costa', 'Juliana Lima', 'Camila Oliveira',
      'Patricia Souza', 'Beatriz Ferreira', 'Larissa Pereira', 'Renata Alves', 'Carla Rodrigues']
    return Array.from({ length: count }, (_, i) => ({
      externalId: `trinks-mock-${i + 1}`,
      fullName: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''),
      phone: `+5511${String(90000000 + i).padStart(8, '0')}`,
      email: `cliente${i + 1}@mock.trinks.com`,
    }))
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _notImplemented(method: string): SyncResult {
    return {
      success: false,
      stats: {
        customersCreated: 0, customersUpdated: 0, customersSkipped: 0,
        appointmentsCreated: 0, appointmentsUpdated: 0, appointmentsSkipped: 0,
        servicesCreated: 0, servicesUpdated: 0, servicesSkipped: 0,
        errors: 1,
      },
      errors: [{ entityType: 'customer', message: `TrinksConnector.${method} not yet implemented. Set TRINKS_MOCK_MODE=true or wait for official API integration.` }],
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
    }
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
}
