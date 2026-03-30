import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CSVConnector } from '@/services/connector/csv.connector'
import { z } from 'zod'

const schema = z.object({
  csvText: z.string().min(1),
  importType: z.enum(['customers', 'appointments', 'services']),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const connector = new CSVConnector()
  const { columns, rows } = connector.parseRawCSV(result.data.csvText)

  // Return first 5 rows as preview
  const preview = rows.slice(0, 5)

  return NextResponse.json({ columns, rows, preview, rowCount: rows.length })
}
