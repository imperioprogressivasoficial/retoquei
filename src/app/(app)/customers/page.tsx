import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { CustomersTableClient } from './CustomersTableClient'

// ---------------------------------------------------------------------------
// Customers Page — server component, data fetching
// ---------------------------------------------------------------------------

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { tenantUsers: { take: 1 } },
  })
  const tenantId = dbUser?.tenantUsers[0]?.tenantId
  if (!tenantId) redirect('/onboarding/1')

  const customers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    include: { metrics: true },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  })

  const data = customers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phoneE164: c.phoneE164,
    lifecycleStage: c.lifecycleStage,
    riskLevel: c.riskLevel,
    lastVisitAt: c.metrics?.lastVisitAt?.toISOString() ?? null,
    daysSinceLastVisit: c.metrics?.daysSinceLastVisit ?? null,
    predictedReturnDate: c.metrics?.predictedReturnDate?.toISOString() ?? null,
    totalAppointments: c.metrics?.totalAppointments ?? 0,
    avgTicket: c.metrics?.avgTicket ?? 0,
    ltv: c.metrics?.ltv ?? 0,
  }))

  return (
    <div>
      <TopBar title="Clientes" subtitle={`${customers.length} clientes`} />
      <div className="p-6">
        <CustomersTableClient data={data} />
      </div>
    </div>
  )
}
