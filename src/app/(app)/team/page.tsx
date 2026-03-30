import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { Users, Crown, UserCheck, UserCog } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  OWNER:   { label: 'Proprietário', icon: Crown,    color: 'text-gold' },
  MANAGER: { label: 'Gerente',      icon: UserCog,  color: 'text-blue-400' },
  STAFF:   { label: 'Equipe',       icon: UserCheck,color: 'text-green-400' },
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { tenantUsers: { take: 1 } },
  })
  const tenantId = dbUser?.tenantUsers[0]?.tenantId
  if (!tenantId) redirect('/onboarding/1')

  const members = await prisma.tenantUser.findMany({
    where: { tenantId },
    include: { user: true },
    orderBy: { invitedAt: 'asc' },
  })

  return (
    <div>
      <TopBar title="Equipe" subtitle={`${members.length} membros`} />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex justify-end">
          <button className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors">
            <Users className="h-3.5 w-3.5" /> Convidar Membro
          </button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#161616]">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Função</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Desde</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const { label, icon: Icon, color } = roleConfig[m.role] ?? roleConfig.STAFF
                return (
                  <tr key={m.id} className="border-b border-border last:border-0 bg-[#1E1E1E]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{m.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{m.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
                        <Icon className="h-3 w-3" />{label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {m.joinedAt ? format(m.joinedAt, 'dd/MM/yyyy', { locale: ptBR }) : 'Pendente'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
