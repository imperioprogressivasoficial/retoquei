import { IConnector, ConnectorConfig, SyncResult, ValidationResult, ConnectorStatus } from './connector.interface'
import { prisma } from '@/lib/prisma'

interface TrinksClient {
  id: number
  nome: string
  email?: string
  cpf?: string
  telefones?: Array<{ numero: string }>
  dataNascimento?: string
  dataCadastro?: string
  dataAtualizacao?: string
  labels?: Array<{ id: number; nome: string }>
}

interface TrinksAPIResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}

export class TrinksConnector implements IConnector {
  type = 'TRINKS'
  private baseUrl = 'https://app.trinks.com.br/api/v1'
  private apiKey: string = ''
  private tenantId: string = ''

  constructor(tenantId: string, apiKey: string) {
    this.tenantId = tenantId
    this.apiKey = apiKey
  }

  /**
   * Validate connection to Trinks API
   */
  async validateConnection(): Promise<ValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/estabelecimentos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return {
          isValid: false,
          error: `Trinks API returned ${response.status}: ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        isValid: true,
        message: 'Successfully connected to Trinks API',
      }
    } catch (error) {
      return {
        isValid: false,
        error: `Failed to connect to Trinks API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Connect to Trinks API
   */
  async connect(config: ConnectorConfig): Promise<ConnectorStatus> {
    try {
      // Validate provided credentials
      const validation = await this.validateConnection()
      if (!validation.isValid) {
        return {
          status: 'error',
          message: validation.error || 'Connection failed',
        }
      }

      return {
        status: 'connected',
        message: 'Successfully connected to Trinks',
      }
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed',
      }
    }
  }

  /**
   * Disconnect from Trinks
   */
  async disconnect(): Promise<void> {
    this.apiKey = ''
  }

  /**
   * Sync customers from Trinks
   */
  async syncCustomers(): Promise<SyncResult> {
    try {
      const connector = await prisma.bookingConnector.findFirst({
        where: {
          tenantId: this.tenantId,
          type: 'TRINKS',
        },
      })

      if (!connector) {
        return {
          success: false,
          message: 'Connector not found',
          customersSynced: 0,
          appointmentsSynced: 0,
        }
      }

      let allClients: TrinksClient[] = []
      let page = 1
      const pageSize = 50

      // Paginate through all clients
      while (true) {
        const response = await fetch(
          `${this.baseUrl}/clientes?page=${page}&pageSize=${pageSize}&incluirDetalhes=true`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch clients: ${response.statusText}`)
        }

        const data: TrinksAPIResponse<TrinksClient> = await response.json()
        allClients = [...allClients, ...data.data]

        if (data.page * data.pageSize >= data.total) {
          break
        }
        page++
      }

      // Map and upsert customers
      let createdCount = 0
      let updatedCount = 0

      for (const trinksClient of allClients) {
        // Extract first phone number
        const phoneNumber = trinksClient.telefones?.[0]?.numero || ''
        const normalizedPhone = phoneNumber.replace(/\D/g, '')

        // Check if customer exists
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            tenantId: this.tenantId,
            OR: [
              { externalId: `trinks_${trinksClient.id}` },
              { phoneE164: `+${normalizedPhone}` },
            ],
          },
        })

        if (existingCustomer) {
          // Update existing customer
          await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              fullName: trinksClient.nome,
              normalizedName: trinksClient.nome.toLowerCase().trim(),
              email: trinksClient.email || undefined,
              phoneE164: normalizedPhone ? `+${normalizedPhone}` : undefined,
              birthdate: trinksClient.dataNascimento ? new Date(trinksClient.dataNascimento) : undefined,
              updatedAt: new Date(),
            },
          })
          updatedCount++
        } else {
          // Create new customer
          if (trinksClient.nome && normalizedPhone) {
            await prisma.customer.create({
              data: {
                tenantId: this.tenantId,
                externalId: `trinks_${trinksClient.id}`,
                fullName: trinksClient.nome,
                normalizedName: trinksClient.nome.toLowerCase().trim(),
                email: trinksClient.email || undefined,
                phoneE164: `+${normalizedPhone}`,
                birthdate: trinksClient.dataNascimento ? new Date(trinksClient.dataNascimento) : undefined,
                lifecycleStage: 'NEW',
                riskLevel: 'LOW',
              },
            })
            createdCount++
          }
        }
      }

      // Update connector sync metadata
      await prisma.bookingConnector.update({
        where: { id: connector.id },
        data: {
          lastSyncAt: new Date(),
        },
      })

      return {
        success: true,
        message: `Synced ${allClients.length} customers`,
        customersSynced: createdCount + updatedCount,
        appointmentsSynced: 0,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
        customersSynced: 0,
        appointmentsSynced: 0,
      }
    }
  }

  /**
   * Sync appointments from Trinks
   */
  async syncAppointments(): Promise<SyncResult> {
    try {
      const connector = await prisma.bookingConnector.findFirst({
        where: {
          tenantId: this.tenantId,
          type: 'TRINKS',
        },
      })

      if (!connector) {
        return {
          success: false,
          message: 'Connector not found',
          customersSynced: 0,
          appointmentsSynced: 0,
        }
      }

      let appointmentCount = 0
      let page = 1
      const pageSize = 50

      // Fetch and process appointments
      while (true) {
        const response = await fetch(
          `${this.baseUrl}/agendamentos?page=${page}&pageSize=${pageSize}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch appointments: ${response.statusText}`)
        }

        const data: any = await response.json()

        for (const apt of data.data) {
          // Find customer by external ID or phone
          const customer = await prisma.customer.findFirst({
            where: {
              tenantId: this.tenantId,
              externalId: `trinks_${apt.clienteId}`,
            },
          })

          if (customer) {
            await prisma.appointment.upsert({
              where: {
                externalId_connectorId: {
                  externalId: `trinks_${apt.id}`,
                  connectorId: connector.id,
                },
              },
              create: {
                tenantId: this.tenantId,
                customerId: customer.id,
                connectorId: connector.id,
                externalId: `trinks_${apt.id}`,
                scheduledAt: new Date(apt.data),
                completedAt: apt.status === 'concluido' ? new Date(apt.data) : null,
                status: apt.status === 'concluido' ? 'COMPLETED' : 'SCHEDULED',
                price: apt.valorTotal || 0,
                notes: apt.observacoes || undefined,
              },
              update: {
                scheduledAt: new Date(apt.data),
                completedAt: apt.status === 'concluido' ? new Date(apt.data) : null,
                status: apt.status === 'concluido' ? 'COMPLETED' : 'SCHEDULED',
                price: apt.valorTotal || 0,
              },
            })
            appointmentCount++
          }
        }

        if (data.page * data.pageSize >= data.total) {
          break
        }
        page++
      }

      return {
        success: true,
        message: `Synced ${appointmentCount} appointments`,
        customersSynced: 0,
        appointmentsSynced: appointmentCount,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Appointment sync failed',
        customersSynced: 0,
        appointmentsSynced: 0,
      }
    }
  }

  /**
   * Sync services from Trinks
   */
  async syncServices(): Promise<SyncResult> {
    try {
      const connector = await prisma.bookingConnector.findFirst({
        where: {
          tenantId: this.tenantId,
          type: 'TRINKS',
        },
      })

      if (!connector) {
        return {
          success: false,
          message: 'Connector not found',
          customersSynced: 0,
          appointmentsSynced: 0,
        }
      }

      const response = await fetch(`${this.baseUrl}/servicos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`)
      }

      const data: TrinksAPIResponse<any> = await response.json()
      let serviceCount = 0

      for (const service of data.data) {
        await prisma.service.upsert({
          where: {
            id: `trinks_${service.id}`,
          },
          create: {
            id: `trinks_${service.id}`,
            tenantId: this.tenantId,
            name: service.nome,
            category: service.categoria || 'General',
            avgPrice: service.preco || 0,
          },
          update: {
            name: service.nome,
            avgPrice: service.preco || 0,
          },
        })
        serviceCount++
      }

      return {
        success: true,
        message: `Synced ${serviceCount} services`,
        customersSynced: 0,
        appointmentsSynced: 0,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Service sync failed',
        customersSynced: 0,
        appointmentsSynced: 0,
      }
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<Date | null> {
    const connector = await prisma.bookingConnector.findFirst({
      where: {
        tenantId: this.tenantId,
        type: 'TRINKS',
      },
    })

    return connector?.lastSyncAt || null
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const connector = await prisma.bookingConnector.findFirst({
      where: {
        tenantId: this.tenantId,
        type: 'TRINKS',
      },
    })

    return {
      lastSync: connector?.lastSyncAt,
      status: connector?.status || 'inactive',
    }
  }
}
