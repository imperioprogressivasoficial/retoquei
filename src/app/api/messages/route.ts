import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const messages = await prisma.message.findMany({
      where: { salonId: salon.id },
      include: { client: { select: { fullName: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ messages })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
