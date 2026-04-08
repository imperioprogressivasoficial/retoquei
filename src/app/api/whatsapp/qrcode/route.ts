import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import {
  evolutionCreateInstance,
  evolutionGetQRCode,
  evolutionGetStatus,
} from '@/services/messaging/evolution.provider'

const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME ?? 'retoquei'

export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (!process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_API_KEY) {
    return NextResponse.json(
      { error: 'Evolution API não configurada. Adicione EVOLUTION_API_URL e EVOLUTION_API_KEY no .env.local' },
      { status: 503 },
    )
  }

  try {
    // Check current status first
    const status = await evolutionGetStatus(INSTANCE)

    if (status?.instance?.state === 'open') {
      return NextResponse.json({ connected: true, status: 'open' })
    }

    // Try to get QR code — if instance doesn't exist, create it first
    let qrData = await evolutionGetQRCode(INSTANCE)

    if (qrData?.error || !qrData?.base64) {
      // Instance may not exist yet, create it
      await evolutionCreateInstance(INSTANCE)
      await new Promise((r) => setTimeout(r, 2000))
      qrData = await evolutionGetQRCode(INSTANCE)
    }

    if (!qrData?.base64) {
      return NextResponse.json({ error: 'Não foi possível gerar o QR Code. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({
      connected: false,
      qrcode: qrData.base64, // base64 image
      status: 'qr',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
