import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { CampaignsClient } from './CampaignsClient'

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let campaigns: any[] = []
  let segments: any[] = []
  let templates: any[] = []

  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { ownedTenants: { take: 1 } } })
    const tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null

    if (tenantId) {
      ;[campaigns, segments, templates] = await Promise.all([
        prisma.campaign.findMany({
          where: { tenantId },
          include: { segment: true, template: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.segment.findMany({
          where: { tenantId, isActive: true },
          orderBy: [{ isSystem: 'desc' }, { customerCount: 'desc' }],
          select: { id: true, name: true, customerCount: true },
        }),
        prisma.messageTemplate.findMany({
          where: { OR: [{ tenantId }, { isSystem: true }] },
          orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
          select: { id: true, name: true, isSystem: true },
        }),
      ])
    }
  } catch { }

  const campaignsData = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    sentCount: c.sentCount,
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
    segment: c.segment ? { name: c.segment.name } : null,
    template: c.template ? { name: c.template.name } : null,
  }))

  return (
    <div>
      <TopBar title="Campanhas" subtitle="Disparos em massa para segmentos" />
      <div className="p-6 space-y-6">
        <CampaignsClient
          initialCampaigns={campaignsData}
          segments={segments}
          templates={templates}
        />
      </div>
    </div>
  )
}
