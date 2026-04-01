import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  phone: z.string().min(8),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { include: { tenant: true }, take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const tenantName = dbUser?.ownedTenants[0]?.tenant?.name ?? 'Seu Salão'

  const template = await prisma.messageTemplate.findFirst({
    where: { id: params.id, OR: [{ tenantId }, { isSystem: true }] },
  })
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const rendered = template.body
    .replace(/\{\{customer_name\}\}/g, 'Maria Silva')
    .replace(/\{\{first_name\}\}/g, 'Maria')
    .replace(/\{\{salon_name\}\}/g, tenantName)
    .replace(/\{\{days_since_last_visit\}\}/g, '28')
    .replace(/\{\{preferred_service\}\}/g, 'Corte e Escova')
    .replace(/\{\{last_visit_date\}\}/g, new Date(Date.now() - 28 * 86400000).toLocaleDateString('pt-BR'))
    .replace(/\{\{predicted_return_date\}\}/g, new Date(Date.now() + 7 * 86400000).toLocaleDateString('pt-BR'))

  console.log(`[MOCK] Test message to ${result.data.phone}:\n${rendered}`)

  await prisma.outboundMessage.create({
    data: {
      tenantId,
      templateId: template.id,
      channel: 'WHATSAPP',
      toNumber: result.data.phone,
      bodyRendered: rendered,
      status: 'SENT',
      sentAt: new Date(),
    },
  }).catch(() => {})

  return NextResponse.json({ ok: true, rendered, mode: 'mock' })
}
