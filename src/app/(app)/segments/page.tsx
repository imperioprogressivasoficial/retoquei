import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { SegmentsClient } from './SegmentsClient'

export default async function SegmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let segments: any[] = []
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { ownedTenants: { take: 1 } } })
    const tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null
    if (tenantId) {
      segments = await prisma.segment.findMany({
        where: { tenantId, isActive: true },
        orderBy: [{ isSystem: 'desc' }, { customerCount: 'desc' }],
      })
    }
  } catch { }

  const serialize = (s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    isSystem: s.isSystem,
    customerCount: s.customerCount,
    lastComputedAt: s.lastComputedAt?.toISOString() ?? null,
  })

  const systemSegments = segments.filter((s) => s.isSystem).map(serialize)
  const customSegments = segments.filter((s) => !s.isSystem).map(serialize)

  return (
    <div>
      <TopBar title="Segmentos" subtitle={`${segments.length} segmentos ativos`} />
      <div className="p-6 space-y-6">
        <SegmentsClient systemSegments={systemSegments} initialCustomSegments={customSegments} />
      </div>
    </div>
  )
}
