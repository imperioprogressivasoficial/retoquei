import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const segment = await prisma.segment.findFirst({ where: { id, salonId: salon.id } })
    if (!segment) return NextResponse.json({ error: 'Segmento não encontrado' }, { status: 404 })

    await prisma.clientSegment.deleteMany({ where: { segmentId: id } })
    await prisma.segment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/segments/[id] error:', err)
    return NextResponse.json({ error: 'Erro ao excluir segmento' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const segment = await prisma.segment.findFirst({ where: { id, salonId: salon.id } })
    if (!segment) return NextResponse.json({ error: 'Segmento não encontrado' }, { status: 404 })

    if (body.action === 'archive') {
      await prisma.segment.update({ where: { id }, data: { archivedAt: new Date() } })
    } else if (body.action === 'unarchive') {
      await prisma.segment.update({ where: { id }, data: { archivedAt: null } })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/segments/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
