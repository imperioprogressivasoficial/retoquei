import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { evolutionGetStatus } from '@/services/messaging/evolution.provider'

const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME ?? 'retoquei'

export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
    return NextResponse.json({ connected: false, status: 'not_configured' })
  }

  try {
    const data = await evolutionGetStatus(INSTANCE)
    const connected = data?.instance?.state === 'open'
    return NextResponse.json({ connected, status: data?.instance?.state ?? 'unknown' })
  } catch {
    return NextResponse.json({ connected: false, status: 'error' })
  }
}
