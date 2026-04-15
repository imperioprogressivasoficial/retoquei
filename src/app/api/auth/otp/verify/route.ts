import { NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/server'

const MAX_ATTEMPTS = 5

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

function hashCode(code: string, phone: string): string {
  return crypto.createHash('sha256').update(`${code}:${phone}`).digest('hex')
}

export async function POST(request: Request) {
  try {
    const { phone: rawPhone, code } = await request.json()

    if (!rawPhone || !code) {
      return NextResponse.json({ error: 'Telefone e código são obrigatórios' }, { status: 400 })
    }

    const phone = normalizePhone(rawPhone)
    const cleanCode = String(code).replace(/\D/g, '').slice(0, 6)

    if (cleanCode.length !== 6) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    }

    // Find the most recent unused OTP for this phone
    const otp = await prisma.otpCode.findFirst({
      where: { phone, usedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 })
    }

    if (otp.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Código expirado. Solicite um novo.' }, { status: 400 })
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Muitas tentativas. Solicite um novo código.' }, { status: 429 })
    }

    const expectedHash = hashCode(cleanCode, phone)

    if (otp.codeHash !== expectedHash) {
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      })
      return NextResponse.json({ error: 'Código incorreto' }, { status: 400 })
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    })

    // Find the profile + user email
    const profile = await prisma.profile.findUnique({ where: { phone } })
    if (!profile?.email) {
      return NextResponse.json(
        { error: 'Usuário sem email cadastrado. Faça login com email e senha.' },
        { status: 400 },
      )
    }

    // Use Supabase admin to generate a magic link — client navigates to it
    // to create the session.
    const supabase = await createAdminClient()
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    })

    if (error || !data?.properties?.action_link) {
      console.error('Supabase admin.generateLink error:', error)
      return NextResponse.json({ error: 'Erro ao gerar sessão' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      actionLink: data.properties.action_link,
    })
  } catch (err: any) {
    console.error('POST /api/auth/otp/verify error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
