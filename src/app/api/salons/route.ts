import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Find the user's salon through salon_members
    const member = await prisma.salonMember.findFirst({
      where: { userId: user.id },
      include: { salon: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ salon: member?.salon ?? null })
  } catch (err) {
    console.error('GET /api/salons error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { name, phone, email } = body

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    // Ensure profile exists (FK requirement for salon_members)
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        email: user.email ?? null,
        fullName: (user as any).user_metadata?.full_name ?? (user as any).user_metadata?.name ?? null,
      },
    })

    // Create salon
    const salon = await prisma.salon.create({
      data: {
        ownerUserId: user.id,
        name,
        slug,
        phone: phone ?? null,
        email: email ?? null,
      },
    })

    // Create owner membership
    await prisma.salonMember.create({
      data: {
        salonId: salon.id,
        userId: user.id,
        role: 'OWNER',
      },
    })

    return NextResponse.json({ salon }, { status: 201 })
  } catch (err) {
    console.error('POST /api/salons error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { name, phone, email } = body

    // Find the user's salon
    const member = await prisma.salonMember.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })

    if (!member) return NextResponse.json({ error: 'Salão não encontrado' }, { status: 404 })

    const salon = await prisma.salon.update({
      where: { id: member.salonId },
      data: {
        name: name || undefined,
        phone: phone ?? undefined,
        email: email ?? undefined,
      },
    })

    return NextResponse.json({ salon })
  } catch (err) {
    console.error('PUT /api/salons error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
