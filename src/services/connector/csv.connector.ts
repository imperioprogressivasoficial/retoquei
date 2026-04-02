import Papa from 'papaparse'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import type { IConnector, RawCustomer, RawAppointment, RawService } from './connector.interface'
import type { ConnectorStatus, SyncResult, ValidationResult, ColumnMapping } from '@/types/connector.types'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// CSV Connector
// Handles file-based imports for customers, appointments, and services.
// ---------------------------------------------------------------------------

export class CSVConnector implements IConnector {
  readonly type = 'CSV' as const

  async connect(_config: Record<string, unknown>) {
    // CSV connectors are always "connected" once configured — no live API
    return { success: true }
  }

  async disconnect() {
    // Nothing to tear down for CSV
  }

  async validateConnection(): Promise<ValidationResult> {
    return { valid: true, errors: [], warnings: [] }
  }

  async syncCustomers(tenantId: string, connectorId: string): Promise<SyncResult> {
    // CSV sync is triggered explicitly via upload — not via scheduled pull
    return this._noopSync('CSV sync is triggered by file upload, not by pull.')
  }

  async syncAppointments(tenantId: string, connectorId: string): Promise<SyncResult> {
    return this._noopSync('CSV sync is triggered by file upload, not by pull.')
  }

  async syncServices(tenantId: string, connectorId: string): Promise<SyncResult> {
    return this._noopSync('CSV sync is triggered by file upload, not by pull.')
  }

  async getLastSync(connectorId: string): Promise<Date | null> {
    const connector = await prisma.bookingConnector.findUnique({ where: { id: connectorId } })
    return connector?.lastSyncAt ?? null
  }

  async getSyncStatus(connectorId: string): Promise<ConnectorStatus> {
    const connector = await prisma.bookingConnector.findUnique({ where: { id: connectorId } })
    return (connector?.status as ConnectorStatus) ?? 'DISCONNECTED'
  }

  // ─── CSV Parsing ──────────────────────────────────────────────────────────

  /** Parse a CSV string and return raw rows with column names */
  parseRawCSV(csvText: string): { columns: string[]; rows: Record<string, string>[] } {
    const result = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    })
    return {
      columns: result.meta.fields ?? [],
      rows: result.data,
    }
  }

  /** Apply column mappings and return typed customer data */
  parseCustomers(rows: Record<string, string>[], mappings: ColumnMapping[]): {
    customers: RawCustomer[]
    errors: Array<{ row: number; message: string }>
  } {
    const customers: RawCustomer[] = []
    const errors: Array<{ row: number; message: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Skip completely empty rows
      const allEmpty = Object.values(row).every(val => !val || !val.toString().trim())
      if (allEmpty) continue

      const get = (target: string) => {
        const m = mappings.find((m) => m.targetField === target)
        return m ? (row[m.csvColumn] ?? '').trim() : ''
      }

      const name = get('customer.name')
      const phone = get('customer.phone')

      if (!name) {
        errors.push({ row: i + 2, message: 'Nome do cliente é obrigatório' })
        continue
      }
      if (!phone) {
        errors.push({ row: i + 2, message: 'Telefone é obrigatório' })
        continue
      }

      const normalizedPhone = this.normalizePhone(phone)
      if (!normalizedPhone) {
        errors.push({ row: i + 2, message: `Telefone inválido: ${phone}` })
        continue
      }

      customers.push({
        fullName: name,
        phone: normalizedPhone,
        email: get('customer.email') || undefined,
        birthdate: this.parseDate(get('customer.birthdate')) || undefined,
        notes: get('customer.notes') || undefined,
        externalId: get('customer.externalId') || undefined,
        tags: get('customer.tags')
          ? get('customer.tags').split(/[,;]/).map((t) => t.trim()).filter(Boolean)
          : undefined,
      })
    }

    return { customers, errors }
  }

  /** Apply column mappings and return typed appointment data */
  parseAppointments(rows: Record<string, string>[], mappings: ColumnMapping[]): {
    appointments: RawAppointment[]
    errors: Array<{ row: number; message: string }>
  } {
    const appointments: RawAppointment[] = []
    const errors: Array<{ row: number; message: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Skip completely empty rows
      const allEmpty = Object.values(row).every(val => !val || !val.toString().trim())
      if (allEmpty) continue

      const get = (target: string) => {
        const m = mappings.find((m) => m.targetField === target)
        return m ? (row[m.csvColumn] ?? '').trim() : ''
      }

      const customerPhone = get('appointment.customerPhone')
      const dateRaw = get('appointment.datetime') || get('appointment.date')

      if (!customerPhone && !get('appointment.customerName')) {
        errors.push({ row: i + 2, message: 'Telefone ou nome do cliente é obrigatório' })
        continue
      }

      // Validate phone format if provided
      if (customerPhone) {
        const normalizedPhone = this.normalizePhone(customerPhone)
        if (!normalizedPhone) {
          errors.push({ row: i + 2, message: `Telefone inválido: ${customerPhone}` })
          continue
        }
      }

      if (!dateRaw) {
        errors.push({ row: i + 2, message: 'Data do agendamento é obrigatória' })
        continue
      }

      const parsedDate = this.parseDate(dateRaw)
      if (!parsedDate) {
        errors.push({ row: i + 2, message: `Data inválida: ${dateRaw}` })
        continue
      }

      const priceRaw = get('appointment.totalValue') || get('appointment.servicePrice')
      const price = priceRaw ? parseFloat(priceRaw.replace(',', '.').replace(/[^0-9.]/g, '')) : undefined

      const statusRaw = get('appointment.status').toLowerCase()
      const status = this.normalizeAppointmentStatus(statusRaw)

      const normalizedPhone = customerPhone ? this.normalizePhone(customerPhone) : ''
      appointments.push({
        customerPhone: normalizedPhone || customerPhone, // Fallback to original if normalization fails
        customerExternalId: get('appointment.customerId') || undefined,
        serviceName: get('appointment.serviceName') || undefined,
        professionalName: undefined,
        scheduledAt: parsedDate,
        completedAt: status === 'completed' ? parsedDate : undefined,
        status,
        price: isNaN(price as number) ? undefined : price,
        notes: get('appointment.notes') || undefined,
        externalId: get('appointment.externalId') || undefined,
      })
    }

    return { appointments, errors }
  }

  /** Apply column mappings and return typed service data */
  parseServices(rows: Record<string, string>[], mappings: ColumnMapping[]): {
    services: RawService[]
    errors: Array<{ row: number; message: string }>
  } {
    const services: RawService[] = []
    const errors: Array<{ row: number; message: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Skip completely empty rows
      const allEmpty = Object.values(row).every(val => !val || !val.toString().trim())
      if (allEmpty) continue

      const get = (target: string) => {
        const m = mappings.find((m) => m.targetField === target)
        return m ? (row[m.csvColumn] ?? '').trim() : ''
      }

      const name = get('service.name')
      if (!name) {
        errors.push({ row: i + 2, message: 'Nome do serviço é obrigatório' })
        continue
      }

      const priceRaw = get('service.price')
      const avgPrice = priceRaw
        ? parseFloat(priceRaw.replace(',', '.').replace(/[^0-9.]/g, ''))
        : undefined

      services.push({
        name,
        category: get('service.category') || undefined,
        avgPrice: isNaN(avgPrice as number) ? undefined : avgPrice,
        externalId: get('service.externalId') || undefined,
      })
    }

    return { services, errors }
  }

  // ─── Phone normalization ──────────────────────────────────────────────────

  normalizePhone(raw: string): string | null {
    if (!raw) return null
    const cleaned = raw.replace(/\D/g, '')

    // Try with Brazil country code first
    try {
      // Already has country code
      if (cleaned.startsWith('55') && cleaned.length >= 12) {
        const parsed = parsePhoneNumber('+' + cleaned)
        if (parsed?.isValid()) return parsed.format('E.164')
      }
      // Add Brazil country code
      const withCode = '+55' + cleaned
      if (isValidPhoneNumber(withCode, 'BR')) {
        return parsePhoneNumber(withCode, 'BR').format('E.164')
      }
    } catch {
      // fall through
    }

    // Return cleaned number with +55 as best effort
    if (cleaned.length >= 10) {
      return '+55' + cleaned.slice(-11)
    }

    return null
  }

  // ─── Date parsing ─────────────────────────────────────────────────────────

  parseDate(raw: string): string | null {
    if (!raw) return null

    // ISO format: 2024-01-15
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const d = new Date(raw)
      return isNaN(d.getTime()) ? null : d.toISOString()
    }

    // BR format: 15/01/2024 or 15/01/2024 14:30
    const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/)
    if (brMatch) {
      const [, day, month, year, hour = '00', min = '00'] = brMatch
      const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${min}:00`)
      return isNaN(d.getTime()) ? null : d.toISOString()
    }

    return null
  }

  // ─── Status normalization ─────────────────────────────────────────────────

  normalizeAppointmentStatus(raw: string): 'completed' | 'scheduled' | 'cancelled' | 'no_show' {
    if (['concluido', 'concluído', 'realizado', 'done', 'completed', 'finalizado'].includes(raw)) return 'completed'
    if (['cancelado', 'cancelled', 'canceled'].includes(raw)) return 'cancelled'
    if (['faltou', 'no_show', 'no show', 'ausente'].includes(raw)) return 'no_show'
    return 'scheduled'
  }

  // ─── Deduplication ───────────────────────────────────────────────────────

  /** Remove duplicate customers by normalized phone, keeping the last occurrence */
  deduplicateCustomers(customers: RawCustomer[]): RawCustomer[] {
    const seen = new Map<string, RawCustomer>()
    for (const c of customers) {
      seen.set(c.phone, c)
    }
    return Array.from(seen.values())
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

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
