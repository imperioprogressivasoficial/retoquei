import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { CSVConnector } from '@/services/connector/csv.connector'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const BUCKET = 'csv-imports'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin credentials not configured')
  return createAdmin(url, key, { auth: { persistSession: false } })
}

const schema = z.object({
  storagePath: z.string().min(1),
  importType: z.enum(['customers', 'appointments', 'services']),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  try {
    const admin = getAdminClient()

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await admin.storage
      .from(BUCKET)
      .download(result.data.storagePath)

    if (downloadError || !fileData) {
      console.error('[csv/upload] Download error:', downloadError)
      return NextResponse.json({ error: 'Erro ao ler arquivo do Storage. Faça o upload novamente.' }, { status: 400 })
    }

    // Convert blob to text
    const csvText = await fileData.text()

    if (!csvText.trim()) {
      return NextResponse.json({ error: 'Arquivo CSV está vazio.' }, { status: 400 })
    }

    const connector = new CSVConnector()
    const { columns, rows } = connector.parseRawCSV(csvText)

    if (columns.length === 0) {
      return NextResponse.json({ error: 'Não foi possível detectar colunas no CSV. Verifique o formato do arquivo.' }, { status: 400 })
    }

    const preview = rows.slice(0, 5)

    return NextResponse.json({
      columns,
      rows,
      preview,
      rowCount: rows.length,
      storagePath: result.data.storagePath,
    })
  } catch (err) {
    console.error('[csv/upload] Error:', err)
    return NextResponse.json({ error: 'Erro ao processar o arquivo. Verifique se é um CSV válido.' }, { status: 500 })
  }
}
