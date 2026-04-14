import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const salon = await getServerSalon()
  if (!salon) return NextResponse.json({ error: 'Salon não encontrado' }, { status: 401 })

  const body = await req.json()
  const { name, triggerType, templateId, isActive, rulesJson } = body

  if (!name || !triggerType) {
    return NextResponse.json({ error: 'Nome e gatilho são obrigatórios' }, { status: 400 })
  }

  const validTriggers = ['AT_RISK', 'BIRTHDAY', 'POST_VISIT', 'WINBACK', 'MANUAL_RULE']
  if (!validTriggers.includes(triggerType)) {
    return NextResponse.json({ error: 'Tipo de gatilho inválido' }, { status: 400 })
  }

  // Validate template belongs to this salon if provided
  if (templateId) {
    const template = await prisma.template.findFirst({
      where: { id: templateId, salonId: salon.id },
    })
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }
  }

  const automation = await prisma.automation.create({
    data: {
      salonId: salon.id,
      name,
      triggerType,
      templateId: templateId || null,
      isActive: isActive ?? false,
      rulesJson: rulesJson ?? null,
    },
  })

  return NextResponse.json(automation, { status: 201 })
}
