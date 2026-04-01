'use client'

import { useState } from 'react'
import { Megaphone, Plus, CheckCircle, Clock, Play, Send, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Rascunho',  color: 'text-muted-foreground' },
  SCHEDULED: { label: 'Agendada',  color: 'text-blue-400' },
  RUNNING:   { label: 'Enviando',  color: 'text-amber-400' },
  COMPLETED: { label: 'Concluída', color: 'text-green-400' },
  CANCELLED: { label: 'Cancelada', color: 'text-muted-foreground' },
}

interface Segment { id: string; name: string; customerCount: number }
interface Template { id: string; name: string; isSystem: boolean }
interface Campaign {
  id: string
  name: string
  status: string
  sentCount: number
  createdAt: string
  segment?: { name: string } | null
  template?: { name: string } | null
}

interface Props {
  initialCampaigns: Campaign[]
  segments: Segment[]
  templates: Template[]
}

export function CampaignsClient({ initialCampaigns, segments, templates }: Props) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [segmentId, setSegmentId] = useState('')
  const [templateId, setTemplateId] = useState('')

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          segmentId: segmentId || undefined,
          templateId: templateId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const seg = segments.find((s) => s.id === segmentId)
      const tpl = templates.find((t) => t.id === templateId)
      setCampaigns((prev) => [{ ...data, segment: seg ? { name: seg.name } : null, template: tpl ? { name: tpl.name } : null }, ...prev])
      setShowCreate(false)
      setName('')
      setSegmentId('')
      setTemplateId('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(id: string) {
    if (!confirm('Enviar esta campanha agora para todos os clientes do segmento?')) return
    setSending(id)
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCampaigns((prev) => prev.map((c) =>
        c.id === id ? { ...c, status: 'COMPLETED', sentCount: data.sentCount } : c
      ))
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSending(null)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => { setShowCreate(true); setName(''); setSegmentId(''); setTemplateId(''); setError('') }}
          className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
        >
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
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const { label, color } = statusConfig[c.status] ?? statusConfig.DRAFT
                const canSend = c.status === 'DRAFT'
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 bg-[#1E1E1E]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{c.name}</p>
                      {c.template && <p className="text-xs text-muted-foreground">{c.template.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.segment?.name ?? 'Todos'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium', color)}>{label}</span>
                    </td>
                    <td className="px-4 py-3 text-white text-sm">{c.sentCount}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(c.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      {canSend && (
                        <button
                          onClick={() => handleSend(c.id)}
                          disabled={sending === c.id}
                          className="flex items-center gap-1 rounded-lg bg-gold/10 text-gold px-2.5 py-1 text-xs font-medium hover:bg-gold/20 transition-colors disabled:opacity-50"
                        >
                          {sending === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          Enviar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-[#1E1E1E] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Nova Campanha</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Nome da campanha</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Promoção de Volta às Aulas"
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Segmento (opcional)</label>
                <select
                  value={segmentId}
                  onChange={(e) => setSegmentId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                >
                  <option value="">Todos os clientes com WhatsApp</option>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.customerCount})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Template de mensagem</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                >
                  <option value="">Selecione um template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.isSystem ? ' (sistema)' : ''}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Campanha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
