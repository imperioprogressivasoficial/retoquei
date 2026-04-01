import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { TeamClient } from './TeamClient'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let members: any[] = []
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { ownedTenants: { take: 1 } } })
    const tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null
    if (tenantId) {
      members = await prisma.tenantUser.findMany({
        where: { tenantId },
        include: { user: true },
        orderBy: { invitedAt: 'asc' },
      })
    }
  } catch { }

  const data = members.map((m) => ({
    id: m.id,
    role: m.role,
    joinedAt: m.joinedAt?.toISOString() ?? null,
    user: { fullName: m.user.fullName, email: m.user.email },
  }))

  return (
    <div>
      <TopBar title="Equipe" subtitle={`${members.length} membros`} />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <TeamClient initialMembers={data} />
      </div>
    </div>
  )
}
