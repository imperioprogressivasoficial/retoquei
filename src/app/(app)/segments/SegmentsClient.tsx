'use client'

import { useState } from 'react'
import { Users, Tag, X, Loader2, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const LIFECYCLE_OPTIONS = [
  { value: 'NEW', label: 'Novos' },
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'RECURRING', label: 'Recorrentes' },
  { value: 'VIP', label: 'VIP' },
  { value: 'AT_RISK', label: 'Em Risco' },
  { value: 'LOST', label: 'Perdidos' },
  { value: 'DORMANT', label: 'Dormentes' },
]

interface Segment {
  id: string
  name: string
  description?: string | null
  isSystem: boolean
  customerCount: number
  lastComputedAt?: string | null
}

interface Props {
  systemSegments: Segment[]
  initialCustomSegments: Segment[]
}

export function SegmentsClient({ systemSegments, initialCustomSegments }: Props) {
  const [customSegments, setCustomSegments] = useState(initialCustomSegments)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedStages, setSelectedStages] = useState<string[]>([])

  function toggleStage(stage: string) {
    setSelectedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    )
  }

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, lifecycleStages: selectedStages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCustomSegments((prev) => [data, ...prev])
      setShowCreate(false)
      setName('')
      setDescription('')
      setSelectedStages([])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const allSegments = [...systemSegments, ...customSegments]

  return (
    <>
      {/* System segments */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Segmentos do Sistema</h2>
        {systemSegments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum segmento do sistema. Importe clientes para gerá-los.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {systemSegments.map((seg) => (
              <div key={seg.id} className="rounded-xl border border-border bg-[#1E1E1E] p-4 hover:border-gold/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-white">{seg.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground bg-white/5 rounded px-1.5 py-0.5">Sistema</span>
                </div>
                {seg.description && <p className="mt-1.5 text-xs text-muted-foreground">{seg.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gold">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-sm font-semibold">{seg.customerCount}</span>
                    <span className="text-xs text-muted-foreground">clientes</span>
                  </div>
                  {seg.lastComputedAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(seg.lastComputedAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom segments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Segmentos Personalizados</h2>
          <button
            onClick={() => { setShowCreate(true); setName(''); setDescription(''); setSelectedStages([]); setError('') }}
            className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
          >
            <Plus className="h-3 w-3" /> Novo Segmento
          </button>
        </div>

        {customSegments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Tag className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-white font-medium">Nenhum segmento personalizado</p>
            <p className="text-xs text-muted-foreground mt-1">Crie segmentos com filtros customizados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customSegments.map((seg) => (
              <div key={seg.id} className="rounded-xl border border-border bg-[#1E1E1E] p-4 hover:border-gold/20 transition-colors">
                <h3 className="text-sm font-medium text-white">{seg.name}</h3>
                {seg.description && <p className="mt-1 text-xs text-muted-foreground">{seg.description}</p>}
                <div className="mt-3 flex items-center gap-1.5 text-gold">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-sm font-semibold">{seg.customerCount}</span>
                  <span className="text-xs text-muted-foreground">clientes</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-[#1E1E1E] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Novo Segmento</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Nome do segmento</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Clientes VIP em risco"
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição (opcional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva este segmento"
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Filtrar por estágio (opcional)</label>
                <div className="flex flex-wrap gap-2">
                  {LIFECYCLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleStage(opt.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedStages.includes(opt.value)
                          ? 'bg-gold text-[#0B0B0B]'
                          : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {selectedStages.length === 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Sem filtro = todos os clientes ativos</p>
                )}
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Segmento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
