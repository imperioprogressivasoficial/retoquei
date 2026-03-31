import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { Zap, Play, Pause, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Automation Flows Page
// ---------------------------------------------------------------------------

const triggerLabels: Record<string, string> = {
  AFTER_APPOINTMENT: 'Após agendamento concluído',
  SEGMENT_ENTER: 'Ao entrar no segmento',
  BIRTHDAY_MONTH: 'Mês de aniversário',
  DAYS_INACTIVE: 'Dias sem visita',
  MANUAL: 'Disparo manual',
}

const PREBUILT_FLOWS = [
  { name: 'Obrigada pela Visita', trigger: 'AFTER_APPOINTMENT', description: 'Mensagem automática após cada visita concluída', color: 'text-green-400' },
  { name: 'Lembrete de Manutenção', trigger: 'DAYS_INACTIVE', description: 'Lembra o cliente quando está na hora de voltar', color: 'text-blue-400' },
  { name: 'Recuperação Em Risco', trigger: 'SEGMENT_ENTER', description: 'Ativa ao cliente entrar no segmento Em Risco', color: 'text-amber-400' },
  { name: 'Reativação de Perdidos', trigger: 'SEGMENT_ENTER', description: 'Campanha para reativar clientes perdidos', color: 'text-red-400' },
  { name: 'Mensagem de Aniversário', trigger: 'BIRTHDAY_MONTH', description: 'Mensagem especial no mês do aniversário', color: 'text-pink-400' },
  { name: 'Apreciação VIP', trigger: 'SEGMENT_ENTER', description: 'Reconhece clientes que se tornam VIP', color: 'text-gold' },
  { name: 'Upsell por Serviço', trigger: 'AFTER_APPOINTMENT', description: 'Sugere serviços baseados no histórico', color: 'text-purple-400' },
]

export default async function FlowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let tenantId: string | null = null
  let flows: any[] = []
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { ownedTenants: { take: 1 } } })
    tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null

    if (tenantId) {
      flows = await prisma.automationFlow.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
        include: { steps: true },
      })
    }
  } catch { }

  return (
    <div>
      <TopBar title="Automações" subtitle="Fluxos de mensagens automáticas" />
      <div className="p-6 space-y-6">

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {flows.filter((f) => f.isActive).length} fluxos ativos de {flows.length}
          </p>
          <button className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors">
            <Zap className="h-3.5 w-3.5" /> Criar Fluxo
          </button>
        </div>

        {/* Flows from DB */}
        {flows.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {flows.map((flow) => (
              <div key={flow.id} className={cn(
                'rounded-xl border bg-[#1E1E1E] p-5 transition-all',
                flow.isActive ? 'border-gold/20' : 'border-border opacity-70',
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', flow.isActive ? 'bg-gold/15' : 'bg-white/5')}>
                      <Zap className={cn('h-4 w-4', flow.isActive ? 'text-gold' : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{flow.name}</h3>
                      <p className="text-xs text-muted-foreground">{triggerLabels[flow.triggerType] ?? flow.triggerType}</p>
                    </div>
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                    flow.isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-muted-foreground',
                  )}>
                    {flow.isActive ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    {flow.isActive ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
                {flow.description && (
                  <p className="mt-2 text-xs text-muted-foreground">{flow.description}</p>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BarChart2 className="h-3 w-3" />{flow.runsCount} execuções</span>
                  <span>{flow.steps.length} etapas</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prebuilt flows (if none in DB) */}
        {flows.length === 0 && (
          <>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Fluxos Pré-configurados</p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {PREBUILT_FLOWS.map((flow) => (
                <div key={flow.name} className="rounded-xl border border-dashed border-border bg-[#1E1E1E]/50 p-5 hover:border-gold/20 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Zap className={cn('h-4 w-4', flow.color)} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">{flow.name}</h3>
                      <p className="text-xs text-muted-foreground">{triggerLabels[flow.trigger]}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{flow.description}</p>
                  <button className="mt-3 text-xs text-gold hover:underline">Ativar fluxo →</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
