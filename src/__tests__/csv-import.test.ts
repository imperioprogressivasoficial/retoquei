import { CSVConnector } from '@/services/connector/csv.connector'
import type { ColumnMapping } from '@/types/connector.types'

/**
 * CSV Import Test Suite
 * Tests for data validation, parsing, normalization, and edge cases
 */

describe('CSVConnector', () => {
  const connector = new CSVConnector()

  describe('Customer Parsing', () => {
    it('should parse valid customer data', () => {
      const rows = [
        {
          'Nome': 'João Silva',
          'Telefone': '11987654321',
          'Email': 'joao@example.com',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Nome', targetField: 'customer.name', required: true },
        { csvColumn: 'Telefone', targetField: 'customer.phone', required: true },
        { csvColumn: 'Email', targetField: 'customer.email', required: false },
      ]

      const result = connector.parseCustomers(rows, mappings as never)
      expect(result.customers).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
      expect(result.customers[0].fullName).toBe('João Silva')
      expect(result.customers[0].phone).toMatch(/^\+55/)
    })

    it('should reject customer without name', () => {
      const rows = [
        {
          'Nome': '',
          'Telefone': '11987654321',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Nome', targetField: 'customer.name', required: true },
        { csvColumn: 'Telefone', targetField: 'customer.phone', required: true },
      ]

      const result = connector.parseCustomers(rows, mappings as never)
      expect(result.customers).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Nome do cliente é obrigatório')
    })

    it('should reject customer without phone', () => {
      const rows = [
        {
          'Nome': 'João Silva',
          'Telefone': '',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Nome', targetField: 'customer.name', required: true },
        { csvColumn: 'Telefone', targetField: 'customer.phone', required: true },
      ]

      const result = connector.parseCustomers(rows, mappings as never)
      expect(result.customers).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Telefone é obrigatório')
    })

    it('should skip completely empty rows', () => {
      const rows = [
        {
          'Nome': 'João Silva',
          'Telefone': '11987654321',
        },
        {
          'Nome': '',
          'Telefone': '',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Nome', targetField: 'customer.name', required: true },
        { csvColumn: 'Telefone', targetField: 'customer.phone', required: true },
      ]

      const result = connector.parseCustomers(rows, mappings as never)
      expect(result.customers).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid phone numbers', () => {
      const rows = [
        {
          'Nome': 'João Silva',
          'Telefone': '123',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Nome', targetField: 'customer.name', required: true },
        { csvColumn: 'Telefone', targetField: 'customer.phone', required: true },
      ]

      const result = connector.parseCustomers(rows, mappings as never)
      expect(result.customers).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Telefone inválido')
    })

    it('should handle various phone formats', () => {
      const phones = [
        '11987654321',
        '(11) 98765-4321',
        '11 98765-4321',
        '5511987654321',
        '+5511987654321',
      ]

      phones.forEach(phone => {
        const normalized = connector.normalizePhone(phone)
        expect(normalized).not.toBeNull()
        expect(normalized).toMatch(/^\+55/)
      })
    })

    it('should parse Brazilian date format', () => {
      const date = connector.parseDate('15/01/2024')
      expect(date).not.toBeNull()
      expect(date).toContain('2024-01-15')
    })

    it('should parse ISO date format', () => {
      const date = connector.parseDate('2024-01-15')
      expect(date).not.toBeNull()
      expect(date).toContain('2024-01-15')
    })

    it('should parse Brazilian date with time', () => {
      const date = connector.parseDate('15/01/2024 14:30')
      expect(date).not.toBeNull()
      expect(date).toContain('2024-01-15T14:30:00')
    })

    it('should reject invalid dates', () => {
      const invalidDates = [
        '32/01/2024',
        '15/13/2024',
        'invalid',
        '2024-13-01',
      ]

      invalidDates.forEach(date => {
        const result = connector.parseDate(date)
        expect(result).toBeNull()
      })
    })

    it('should deduplicate customers by phone', () => {
      const customers = [
        { fullName: 'João Silva', phone: '+5511987654321' },
        { fullName: 'João Silva Duplicado', phone: '+5511987654321' },
        { fullName: 'Maria Santos', phone: '+5511987654322' },
      ] as never[]

      const deduped = connector.deduplicateCustomers(customers)
      expect(deduped).toHaveLength(2)
      // Last occurrence should win
      expect(deduped[0].fullName).toBe('João Silva Duplicado')
    })

    it('should parse customer tags from comma/semicolon separated values', () => {
      const rows = [
        {
          'Nome': 'João Silva',
          'Telefone': '11987654321',
          'Tags': 'premium, frequente; vip',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Nome', targetField: 'customer.name', required: true },
        { csvColumn: 'Telefone', targetField: 'customer.phone', required: true },
        { csvColumn: 'Tags', targetField: 'customer.tags', required: false },
      ]

      const result = connector.parseCustomers(rows, mappings as never)
      expect(result.customers[0].tags).toEqual(['premium', 'frequente', 'vip'])
    })
  })

  describe('Appointment Parsing', () => {
    it('should validate phone in appointments', () => {
      const rows = [
        {
          'Telefone': '123', // Invalid
          'Data': '15/01/2024',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Telefone', targetField: 'appointment.customerPhone', required: true },
        { csvColumn: 'Data', targetField: 'appointment.datetime', required: true },
      ]

      const result = connector.parseAppointments(rows, mappings as never)
      expect(result.appointments).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Telefone inválido')
    })

    it('should accept appointment with valid phone', () => {
      const rows = [
        {
          'Telefone': '11987654321',
          'Data': '15/01/2024',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Telefone', targetField: 'appointment.customerPhone', required: true },
        { csvColumn: 'Data', targetField: 'appointment.datetime', required: true },
      ]

      const result = connector.parseAppointments(rows, mappings as never)
      expect(result.appointments).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
    })

    it('should skip empty appointment rows', () => {
      const rows = [
        {
          'Telefone': '11987654321',
          'Data': '15/01/2024',
        },
        {
          'Telefone': '',
          'Data': '',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Telefone', targetField: 'appointment.customerPhone', required: true },
        { csvColumn: 'Data', targetField: 'appointment.datetime', required: true },
      ]

      const result = connector.parseAppointments(rows, mappings as never)
      expect(result.appointments).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
    })

    it('should normalize appointment status', () => {
      const statuses = [
        ['concluído', 'completed'],
        ['realizado', 'completed'],
        ['cancelado', 'cancelled'],
        ['faltou', 'no_show'],
        ['agendado', 'scheduled'],
      ] as const

      statuses.forEach(([input, expected]) => {
        const result = connector.normalizeAppointmentStatus(input)
        expect(result).toBe(expected)
      })
    })

    it('should parse appointment prices with Brazilian format', () => {
      const prices = [
        ['1.200,50', 1200.5],
        ['1200.50', 1200.5],
        ['100,00', 100],
        ['50', 50],
      ] as const

      prices.forEach(([input, expected]) => {
        const parsed = parseFloat(input.replace(',', '.').replace(/[^0-9.]/g, ''))
        expect(parsed).toBe(expected)
      })
    })
  })

  describe('Service Parsing', () => {
    it('should parse valid service data', () => {
      const rows = [
        {
          'Nome': 'Corte de cabelo',
          'Categoria': 'Cabelo',
          'Preço': '50,00',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Nome', targetField: 'service.name', required: true },
        { csvColumn: 'Categoria', targetField: 'service.category', required: false },
        { csvColumn: 'Preço', targetField: 'service.price', required: false },
      ]

      const result = connector.parseServices(rows, mappings as never)
      expect(result.services).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
      expect(result.services[0].avgPrice).toBe(50)
    })

    it('should reject service without name', () => {
      const rows = [
        {
          'Nome': '',
          'Categoria': 'Cabelo',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Nome', targetField: 'service.name', required: true },
        { csvColumn: 'Categoria', targetField: 'service.category', required: false },
      ]

      const result = connector.parseServices(rows, mappings as never)
      expect(result.services).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
    })

    it('should skip empty service rows', () => {
      const rows = [
        {
          'Nome': 'Corte de cabelo',
          'Categoria': 'Cabelo',
        },
        {
          'Nome': '',
          'Categoria': '',
        },
      ]

      const mappings: ColumnMapping[] = [
        { csvColumn: 'Nome', targetField: 'service.name', required: true },
        { csvColumn: 'Categoria', targetField: 'service.category', required: false },
      ]

      const result = connector.parseServices(rows, mappings as never)
      expect(result.services).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('CSV Parsing', () => {
    it('should parse CSV with commas', () => {
      const csv = `Nome,Telefone,Email
João Silva,11987654321,joao@example.com
Maria Santos,11987654322,maria@example.com`

      const result = connector.parseRawCSV(csv)
      expect(result.columns).toEqual(['Nome', 'Telefone', 'Email'])
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]['Nome']).toBe('João Silva')
    })

    it('should parse CSV with semicolons', () => {
      const csv = `Nome;Telefone;Email
João Silva;11987654321;joao@example.com
Maria Santos;11987654322;maria@example.com`

      const result = connector.parseRawCSV(csv)
      expect(result.columns).toEqual(['Nome', 'Telefone', 'Email'])
      expect(result.rows).toHaveLength(2)
    })

    it('should trim column headers', () => {
      const csv = `  Nome  , Telefone , Email
João Silva,11987654321,joao@example.com`

      const result = connector.parseRawCSV(csv)
      expect(result.columns).toEqual(['Nome', 'Telefone', 'Email'])
    })

    it('should skip empty lines', () => {
      const csv = `Nome,Telefone,Email
João Silva,11987654321,joao@example.com

Maria Santos,11987654322,maria@example.com`

      const result = connector.parseRawCSV(csv)
      expect(result.rows).toHaveLength(2)
    })
  })
})
