import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { evolutionCreateInstance } from '@/services/messaging/evolution.provider'

const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME ?? 'retoquei'

export async function POST(req: Request) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
    return NextResponse.json(
      { error: 'Evolution API não configurada' },
      { status: 503 },
    )
  }

  const { phone } = await req.json()
  if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Número inválido' }, { status: 400 })
  }

  const digits = phone.replace(/\D/g, '')
  const fullNumber = digits.startsWith('55') ? digits : `55${digits}`

  const baseUrl = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
  const apiKey = process.env.EVOLUTION_API_KEY ?? ''

  try {
    // Ensure instance exists
    await evolutionCreateInstance(INSTANCE)
    await new Promise((r) => setTimeout(r, 1500))

    // Request pairing code via Evolution API
    const res = await fetch(`${baseUrl}/instance/connect/${INSTANCE}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
    })

    const data = await res.json()

    // If the API returns a pairing code
    if (data?.pairingCode) {
      return NextResponse.json({ code: data.pairingCode })
    }

    // Fallback: try the connect endpoint with number parameter
    const res2 = await fetch(`${baseUrl}/instance/connect/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({ number: fullNumber }),
    })

    const data2 = await res2.json()

    if (data2?.pairingCode || data2?.code) {
      return NextResponse.json({ code: data2.pairingCode ?? data2.code })
    }

    return NextResponse.json(
      { error: 'Não foi possível gerar o código de pareamento. Tente via QR Code.' },
      { status: 500 },
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
