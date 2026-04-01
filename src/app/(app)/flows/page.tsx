import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { FlowsClient } from './FlowsClient'

export default async function FlowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let flows: any[] = []
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { ownedTenants: { take: 1 } } })
    const tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null
    if (tenantId) {
      flows = await prisma.automationFlow.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
        include: { steps: true },
      })
    }
  } catch { }

  const data = flows.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    triggerType: f.triggerType,
    isActive: f.isActive,
    runsCount: f.runsCount,
    steps: f.steps.map((s: any) => ({ id: s.id })),
  }))

  return (
    <div>
      <TopBar title="Automações" subtitle="Fluxos de mensagens automáticas" />
      <div className="p-6 space-y-6">
        <FlowsClient initialFlows={data} />
      </div>
    </div>
  )
}
