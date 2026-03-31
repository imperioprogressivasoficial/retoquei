import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'
import { cookies } from 'next/headers'

// ---------------------------------------------------------------------------
// App Shell Layout — authenticated, connector-gated
// ---------------------------------------------------------------------------

const IS_DEV_MODE = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Dev mode bypass: use mock data when Supabase is not configured
  if (IS_DEV_MODE) {
    const cookieStore = await cookies()
    const devUser = cookieStore.get('dev_user')?.value
    if (!devUser) redirect('/login')

    const parsed = JSON.parse(decodeURIComponent(devUser))
    return (
      <div className="flex h-screen bg-[#0B0B0B]">
        <Sidebar tenantName="Salão Demo" userEmail={parsed.email ?? 'dev@retoquei.com'} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Load user + tenant
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      ownedTenants: {
        include: { tenant: true },
        orderBy: { invitedAt: 'asc' },
        take: 1,
      },
    },
  })

  if (!dbUser || dbUser.ownedTenants.length === 0) {
    redirect('/onboarding/1')
  }

  const tenant = dbUser.ownedTenants[0].tenant

  // Check connector gate — must have at least one connected connector
  const connectorCount = await prisma.bookingConnector.count({
    where: {
      tenantId: tenant.id,
      status: { in: ['CONNECTED', 'SYNCING'] },
    },
  })

  if (connectorCount === 0) {
    redirect('/onboarding/3')
  }

  return (
    <div className="flex h-screen bg-[#0B0B0B]">
      <Sidebar tenantName={tenant.name} userEmail={user.email} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
