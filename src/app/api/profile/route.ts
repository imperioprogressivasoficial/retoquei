import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('GET /api/profile error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { phone: rawPhone, fullName } = body

    let phone: string | null = null
    if (rawPhone !== undefined && rawPhone !== null && rawPhone !== '') {
      phone = normalizePhone(String(rawPhone))
      if (phone.length < 12) {
        return NextResponse.json({ error: 'Telefone inválido. Use DDD + número.' }, { status: 400 })
      }

      // Check if another profile already uses this phone
      const existing = await prisma.profile.findUnique({ where: { phone } })
      if (existing && existing.userId !== user.id) {
        return NextResponse.json(
          { error: 'Este telefone já está em uso por outra conta.' },
          { status: 409 },
        )
      }
    }

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        phone: rawPhone === null || rawPhone === '' ? null : phone,
        fullName: fullName === undefined ? undefined : fullName,
      },
      create: {
        userId: user.id,
        email: user.email ?? null,
        phone,
        fullName: fullName ?? null,
      },
    })

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('PUT /api/profile error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
