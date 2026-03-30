import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { Megaphone, Plus, CheckCircle, Clock, Play } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Campaigns Page
// ---------------------------------------------------------------------------

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  DRAFT:     { label: 'Rascunho',   icon: Clock,         color: 'text-muted-foreground' },
  SCHEDULED: { label: 'Agendada',   icon: Clock,         color: 'text-blue-400' },
  RUNNING:   { label: 'Enviando',   icon: Play,          color: 'text-amber-400' },
  COMPLETED: { label: 'Concluída',  icon: CheckCircle,   color: 'text-green-400' },
  CANCELLED: { label: 'Cancelada',  icon: CheckCircle,   color: 'text-muted-foreground' },
}

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { tenantUsers: { take: 1 } },
  })
  const tenantId = dbUser?.tenantUsers[0]?.tenantId
  if (!tenantId) redirect('/onboarding/1')

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId },
    include: { segment: true, template: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <TopBar title="Campanhas" subtitle="Disparos em massa para segmentos" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <button className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Nova Campanha
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-white">Nenhuma campanha ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Crie campanhas para enviar mensagens em massa para segmentos</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-[#161616]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Campanha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Segmento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Enviados</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const { label, icon: Icon, color } = statusConfig[c.status] ?? statusConfig.DRAFT
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 bg-[#1E1E1E] hover:bg-white/5 cursor-pointer">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{c.name}</p>
                        {c.template && <p className="text-xs text-muted-foreground">{c.template.name}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{c.segment?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('flex items-center gap-1 text-xs font-medium', color)}>
                          <Icon className="h-3 w-3" />{label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-sm">{c.sentCount}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {format(c.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
