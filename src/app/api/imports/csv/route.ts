import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function detectSeparator(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  return semicolons >= commas ? ';' : ','
}

function splitLine(line: string, sep: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' || ch === "'") {
      inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const sep = detectSeparator(lines[0])
  const headers = splitLine(lines[0], sep).map(normalizeHeader)
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i], sep)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').replace(/^["']|["']$/g, '').trim()
    })
    rows.push(row)
  }

  return rows
}

function getField(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key]) return row[key]
  }
  return ''
}

export async function POST(request: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)

    const importRecord = await prisma.import.create({
      data: {
        salonId: salon.id,
        type: 'CSV',
        filename: file.name,
        status: 'PROCESSING',
        totalRows: rows.length,
      },
    })

    let importedRows = 0
    let failedRows = 0
    const errorLog: string[] = []

    for (const row of rows) {
      const name = getField(row, 'nome', 'name', 'full_name', 'nome_completo', 'cliente', 'client', 'nomecompleeto', 'nomecompleato')
      const phone = getField(row, 'telefone', 'phone', 'celular', 'whatsapp', 'fone', 'tel', 'numero', 'number')
      const email = getField(row, 'email', 'e_mail', 'email_address')

      if (!name || !phone) {
        failedRows++
        errorLog.push(`Linha ignorada: nome="${name}" telefone="${phone}"`)
        continue
      }

      const phoneNormalized = normalizePhone(phone)
      if (!phoneNormalized || phoneNormalized.length < 8) {
        failedRows++
        errorLog.push(`Telefone inválido: ${phone}`)
        continue
      }

      try {
        const existing = await prisma.client.findFirst({
          where: { salonId: salon.id, phoneNormalized },
        })

        if (!existing) {
          await prisma.client.create({
            data: {
              salonId: salon.id,
              fullName: name,
              phone,
              phoneNormalized,
              email: email || null,
              source: 'CSV',
              lifecycleStage: 'NEW',
            },
          })
          importedRows++
        } else {
          importedRows++
        }
      } catch (err) {
        failedRows++
        errorLog.push(`Erro ao importar: ${name}`)
      }
    }

    await prisma.import.update({
      where: { id: importRecord.id },
      data: {
        status: failedRows === rows.length ? 'FAILED' : 'COMPLETED',
        importedRows,
        failedRows,
        errorLog: errorLog.length > 0 ? (errorLog as any) : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      totalRows: rows.length,
      importedRows,
      failedRows,
      errors: errorLog.slice(0, 10),
    })
  } catch (err) {
    console.error('CSV import error:', err)
    return NextResponse.json({ error: 'Erro ao processar CSV', details: String(err) }, { status: 500 })
  }
}
