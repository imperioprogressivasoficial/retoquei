import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Universal webhook endpoint for receiving leads from external platforms.
 *
 * Supported platforms: Trinks, Salão 99, AgendZap, or any custom system.
 *
 * POST /api/webhooks/leads?salon_id=<SALON_ID>&source=<SOURCE>
 *
 * Body (JSON):
 * {
 *   "name": "Maria Silva",         // required
 *   "phone": "11987654321",        // required
 *   "email": "maria@email.com",    // optional
 *   "source": "trinks",            // optional (overrides query param)
 *   "notes": "Corte + Escova",     // optional
 *   "external_id": "TRK-12345"    // optional external reference
 * }
 *
 * Also supports batch:
 * { "leads": [ { "name": "...", "phone": "..." }, ... ] }
 */

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55')) return `+${digits}`
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`
  return `+${digits}`
}

interface LeadInput {
  name?: string
  fullName?: string
  phone?: string
  telefone?: string
  celular?: string
  email?: string
  source?: string
  notes?: string
  external_id?: string
  externalId?: string
}

function extractLead(input: LeadInput) {
  const name = input.name || input.fullName || 'Cliente'
  const phone = input.phone || input.telefone || input.celular || ''
  const email = input.email || null
  const notes = input.notes || null
  const externalId = input.external_id || input.externalId || null
  return { name, phone, email, notes, externalId }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const salonId = url.searchParams.get('salon_id')
    const sourceParam = url.searchParams.get('source') ?? 'webhook'

    if (!salonId) {
      return NextResponse.json(
        { error: 'salon_id query parameter is required' },
        { status: 400 },
      )
    }

    // Verify salon exists
    const salon = await prisma.salon.findUnique({ where: { id: salonId } })
    if (!salon) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 })
    }

    const body = await req.json()

    // Support batch or single lead
    const leads: LeadInput[] = Array.isArray(body.leads)
      ? body.leads
      : [body]

    let created = 0
    let updated = 0
    let failed = 0
    const errors: string[] = []

    for (const input of leads) {
      try {
        const lead = extractLead(input)
        const source = (input.source || sourceParam).toUpperCase()

        if (!lead.phone) {
          errors.push(`Missing phone for "${lead.name}"`)
          failed++
          continue
        }

        const phoneNormalized = normalizePhone(lead.phone)
        const phone = phoneNormalized

        // Upsert: update if phone exists, create otherwise
        const existing = await prisma.client.findFirst({
          where: {
            salonId,
            phoneNormalized: phoneNormalized.replace(/\D/g, ''),
          },
        })

        if (existing) {
          await prisma.client.update({
            where: { id: existing.id },
            data: {
              fullName: lead.name !== 'Cliente' ? lead.name : existing.fullName,
              email: lead.email ?? existing.email,
              notes: lead.notes
                ? existing.notes
                  ? `${existing.notes}\n${lead.notes}`
                  : lead.notes
                : existing.notes,
              externalId: lead.externalId ?? existing.externalId,
              deletedAt: null, // reactivate if soft-deleted
            },
          })
          updated++
        } else {
          await prisma.client.create({
            data: {
              salonId,
              fullName: lead.name,
              phone,
              phoneNormalized: phoneNormalized.replace(/\D/g, ''),
              email: lead.email,
              notes: lead.notes,
              externalId: lead.externalId,
              source: source === 'TRINKS' || source === 'SALAO99' || source === 'AGENDZAP'
                ? 'IMPORT'
                : 'MANUAL',
              tags: [source.toLowerCase()],
            },
          })
          created++
        }
      } catch (err: any) {
        errors.push(err?.message || 'unknown error')
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      summary: { total: leads.length, created, updated, failed },
      ...(errors.length > 0 && { errors }),
    })
  } catch (err: any) {
    console.error('POST /api/webhooks/leads error:', err)
    return NextResponse.json(
      { error: 'Internal error', message: err?.message },
      { status: 500 },
    )
  }
}

// Health check / info
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/webhooks/leads',
    method: 'POST',
    description: 'Receive leads from external platforms (Trinks, Salão 99, AgendZap, etc.)',
    required_params: { salon_id: 'Your salon UUID (query param)' },
    body_format: {
      name: 'string (required)',
      phone: 'string (required)',
      email: 'string (optional)',
      source: 'string (optional: trinks, salao99, agendzap)',
      notes: 'string (optional)',
      external_id: 'string (optional)',
    },
    batch_format: '{ "leads": [ { ... }, { ... } ] }',
  })
}
