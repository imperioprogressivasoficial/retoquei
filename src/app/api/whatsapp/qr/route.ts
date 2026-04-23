import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'

/**
 * GET /api/whatsapp/qr
 * Get WhatsApp QR code from Baileys server
 * Shows connection status and QR for scanning
 */

const BAILEYS_URL = process.env.BAILEYS_SERVER_URL || 'http://localhost:3001'

export async function GET(req: Request) {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Get QR from Baileys server
    const res = await fetch(`${BAILEYS_URL}/api/qr`)

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Erro ao conectar com servidor Baileys' },
        { status: 503 },
      )
    }

    const data = await res.json()

    return NextResponse.json({
      status: data.status,
      qr: data.qr,
      message:
        data.status === 'connected'
          ? 'WhatsApp conectado! ✅'
          : data.status === 'waiting'
            ? 'Escaneie o QR code com seu WhatsApp'
            : 'Conectando...',
    })
  } catch (err: any) {
    console.error('GET /api/whatsapp/qr error:', err)
    return NextResponse.json(
      { error: 'Erro ao obter QR code', status: 'error' },
      { status: 503 },
    )
  }
}
