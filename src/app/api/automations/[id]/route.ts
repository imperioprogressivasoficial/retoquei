import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const automation = await prisma.automation.findFirst({ where: { id, salonId: salon.id } })
    if (!automation) return NextResponse.json({ error: 'Automação não encontrada' }, { status: 404 })

    await prisma.automation.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/automations/[id] error:', err)
    return NextResponse.json({ error: 'Erro ao excluir automação' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const automation = await prisma.automation.findFirst({ where: { id, salonId: salon.id } })
    if (!automation) return NextResponse.json({ error: 'Automação não encontrada' }, { status: 404 })

    if (body.action === 'archive') {
      await prisma.automation.update({ where: { id }, data: { archivedAt: new Date() } })
    } else if (body.action === 'unarchive') {
      await prisma.automation.update({ where: { id }, data: { archivedAt: null } })
    } else if (body.action === 'toggle') {
      // Toggle isActive status
      await prisma.automation.update({ where: { id }, data: { isActive: !automation.isActive } })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/automations/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
