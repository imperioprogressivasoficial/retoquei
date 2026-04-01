import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { TemplatesClient } from './TemplatesClient'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let tenantId: string | null = null
  let templates: any[] = []
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { ownedTenants: { take: 1 } } })
    tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null
    if (tenantId) {
      templates = await prisma.messageTemplate.findMany({
        where: { OR: [{ tenantId }, { isSystem: true }] },
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
      })
    } else {
      templates = await prisma.messageTemplate.findMany({ where: { isSystem: true } })
    }
  } catch { }

  const data = templates.map((t) => ({
    id: t.id,
    name: t.name,
    body: t.body,
    variables: t.variables,
    isSystem: t.isSystem,
    category: t.category,
  }))

  return (
    <div>
      <TopBar title="Templates" subtitle="Mensagens personalizadas" />
      <div className="p-6 space-y-6">
        <TemplatesClient initialTemplates={data} />
      </div>
    </div>
  )
}
