import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { getMessagingProvider } from '@/services/messaging/messaging.factory'

const OTP_EXPIRY_MINUTES = 5
const RATE_LIMIT_SECONDS = 60

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

function generateCode(): string {
  // 6-digit numeric code
  const n = crypto.randomInt(0, 1_000_000)
  return n.toString().padStart(6, '0')
}

function hashCode(code: string, phone: string): string {
  return crypto.createHash('sha256').update(`${code}:${phone}`).digest('hex')
}

export async function POST(request: Request) {
  try {
    const { phone: rawPhone } = await request.json()

    if (!rawPhone || typeof rawPhone !== 'string') {
      return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })
    }

    const phone = normalizePhone(rawPhone)
    if (phone.length < 12) {
      return NextResponse.json({ error: 'Telefone inválido. Use DDD + número.' }, { status: 400 })
    }

    // Look up the profile by phone to ensure user exists (don't leak existence)
    const profile = await prisma.profile.findUnique({ where: { phone } })

    // Rate-limit: check last OTP for this phone
    const lastOtp = await prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    })

    if (lastOtp) {
      const secondsSinceLast = (Date.now() - lastOtp.createdAt.getTime()) / 1000
      if (secondsSinceLast < RATE_LIMIT_SECONDS) {
        return NextResponse.json(
          {
            error: `Aguarde ${Math.ceil(RATE_LIMIT_SECONDS - secondsSinceLast)}s antes de pedir outro código`,
          },
          { status: 429 },
        )
      }
    }

    // Always respond with success shape even if profile doesn't exist
    // (prevents phone enumeration). We just don't actually send.
    if (!profile) {
      return NextResponse.json({
        success: true,
        message: 'Se o telefone estiver cadastrado, você receberá um código em breve.',
      })
    }

    const code = generateCode()
    const codeHash = hashCode(code, phone)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await prisma.otpCode.create({
      data: { phone, codeHash, expiresAt },
    })

    // Send via WhatsApp
    try {
      const provider = getMessagingProvider()
      const message = `Seu código de acesso Retoquei é: *${code}*\n\nVálido por ${OTP_EXPIRY_MINUTES} minutos. Não compartilhe este código.`
      const result = await provider.sendTextMessage(phone, message)
      if (!result.success) {
        console.error('OTP send failed:', result.error)
        // Still return success to client to prevent enumeration / leaking
      }
    } catch (err) {
      console.error('OTP dispatch error:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Código enviado via WhatsApp. Válido por 5 minutos.',
    })
  } catch (err: any) {
    console.error('POST /api/auth/otp/send error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
