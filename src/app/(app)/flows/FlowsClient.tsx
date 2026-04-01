'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Play, Pause, BarChart2, X, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface Flow {
  id: string
  name: string
  description?: string | null
  triggerType: string
  isActive: boolean
  runsCount: number
  steps: { id: string }[]
}

interface Props {
  initialFlows: Flow[]
}

export function FlowsClient({ initialFlows }: Props) {
  const router = useRouter()
  const [flows, setFlows] = useState(initialFlows)
  const [activating, setActivating] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [createName, setCreateName] = useState('')
  const [createTrigger, setCreateTrigger] = useState('MANUAL')
  const [createDesc, setCreateDesc] = useState('')

  async function handleActivatePrebuilt(flow: typeof PREBUILT_FLOWS[0]) {
    setActivating(flow.name)
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flow.name,
          description: flow.description,
          triggerType: flow.trigger,
          activate: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFlows((prev) => [...prev, { ...data, steps: [] }])
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setActivating(null)
    }
  }

  async function handleToggle(id: string) {
    setToggling(id)
    try {
      const res = await fetch(`/api/flows/${id}/toggle`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFlows((prev) => prev.map((f) => f.id === id ? { ...f, isActive: data.isActive } : f))
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setToggling(null)
    }
  }

  async function handleCreate() {
    if (!createName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName, description: createDesc, triggerType: createTrigger, activate: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFlows((prev) => [...prev, { ...data, steps: [] }])
      setShowCreate(false)
      setCreateName('')
      setCreateDesc('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const activatedNames = new Set(flows.map((f) => f.name))

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {flows.filter((f) => f.isActive).length} fluxos ativos de {flows.length}
        </p>
        <button
          onClick={() => { setShowCreate(true); setCreateName(''); setCreateDesc(''); setError('') }}
          className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
        >
          <Zap className="h-3.5 w-3.5" /> Criar Fluxo
        </button>
      </div>

      {/* Active flows from DB */}
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
                <button
                  onClick={() => handleToggle(flow.id)}
                  disabled={toggling === flow.id}
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors cursor-pointer',
                    flow.isActive ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-white/5 text-muted-foreground hover:bg-green-500/10 hover:text-green-400',
                  )}
                >
                  {toggling === flow.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : flow.isActive ? <><Pause className="h-3 w-3" />Ativo</> : <><Play className="h-3 w-3" />Inativo</>
                  }
                </button>
              </div>
              {flow.description && <p className="mt-2 text-xs text-muted-foreground">{flow.description}</p>}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BarChart2 className="h-3 w-3" />{flow.runsCount} execuções</span>
                <span>{flow.steps.length} etapas</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prebuilt flows section */}
      {PREBUILT_FLOWS.some((f) => !activatedNames.has(f.name)) && (
        <>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Fluxos Pré-configurados</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {PREBUILT_FLOWS.filter((f) => !activatedNames.has(f.name)).map((flow) => (
              <div key={flow.name} className="rounded-xl border border-dashed border-border bg-[#1E1E1E]/50 p-5 hover:border-gold/20 transition-colors group">
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
                <button
                  onClick={() => handleActivatePrebuilt(flow)}
                  disabled={activating === flow.name}
                  className="mt-3 text-xs text-gold hover:underline disabled:opacity-50 flex items-center gap-1"
                >
                  {activating === flow.name ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Ativar fluxo →
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-[#1E1E1E] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Criar Fluxo</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Nome</label>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ex: Pós-consulta"
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Gatilho</label>
                <select
                  value={createTrigger}
                  onChange={(e) => setCreateTrigger(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                >
                  {Object.entries(triggerLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição (opcional)</label>
                <input
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Descreva o objetivo deste fluxo"
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={loading || !createName.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar e Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
