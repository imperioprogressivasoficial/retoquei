import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Try to load tenant info — fail gracefully if DB is unavailable
  let tenantName = 'Meu Salão'
  let userEmail = user.email ?? ''

  try {
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

    if (!dbUser) {
      // First login — create DB user and send to onboarding
      await prisma.user.create({
        data: {
          supabaseId: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name ?? user.email!.split('@')[0],
        },
      })
      redirect('/onboarding/1')
    }

    if (dbUser.ownedTenants.length === 0) {
      redirect('/onboarding/1')
    }

    tenantName = dbUser.ownedTenants[0].tenant.name
  } catch {
    // DB unreachable — still show the app with default values
  }

  return (
    <div className="flex h-screen bg-[#0B0B0B]">
      <Sidebar tenantName={tenantName} userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
