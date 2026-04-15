'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Check, CloudUpload } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

interface Segment { id: string; name: string }
interface Template { id: string; name: string; content: string }

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [segments, setSegments] = useState<Segment[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [segmentId, setSegmentId] = useState('')
  const [writeManual, setWriteManual] = useState(false)
  const [manualContent, setManualContent] = useState('')
  const [name, setName] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const creatingDraft = useRef(false)

  // Fetch segments + templates on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/segments').then((r) => r.json()),
      fetch('/api/templates').then((r) => r.json()),
    ]).then(([sData, tData]) => {
      setSegments(sData.segments ?? [])
      setTemplates(tData.templates ?? [])
    })
  }, [])

  // Debounce user input for auto-save
  const debouncedName = useDebounce(name, 1000)
  const debouncedManual = useDebounce(manualContent, 1000)

  // Auto-save: when name first appears, create the draft. Then save updates.
  useEffect(() => {
    if (!debouncedName || debouncedName.length < 2) return
    if (creatingDraft.current) return

    async function save() {
      try {
        setSaveState('saving')

        if (!draftId) {
          creatingDraft.current = true
          const res = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: debouncedName }),
          })
          const json = await res.json()
          if (!res.ok) {
            setSaveState('error')
            creatingDraft.current = false
            return
          }
          setDraftId(json.campaign.id)
          creatingDraft.current = false
          setSaveState('saved')
          return
        }

        const patch: Record<string, any> = { name: debouncedName }
        if (segmentId) patch.segmentId = segmentId
        if (writeManual) {
          patch.manualContent = debouncedManual || ''
          patch.templateId = null
        } else if (selectedTemplateId) {
          patch.templateId = selectedTemplateId
        }
        if (scheduledAt) patch.scheduledAt = new Date(scheduledAt).toISOString()

        const res = await fetch(`/api/campaigns/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (res.ok) setSaveState('saved')
        else setSaveState('error')
      } catch {
        setSaveState('error')
      }
    }

    save()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName, debouncedManual, segmentId, selectedTemplateId, writeManual, scheduledAt])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        name,
        segmentId: segmentId || undefined,
        templateId: writeManual ? undefined : selectedTemplateId || undefined,
        manualContent: writeManual ? manualContent : undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }

      let campaignId = draftId

      if (draftId) {
        const res = await fetch(`/api/campaigns/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = await res.json()
          setError(json.error ?? 'Erro ao salvar campanha')
          setLoading(false)
          return
        }
      } else {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Erro ao criar campanha')
          setLoading(false)
          return
        }
        campaignId = json.campaign?.id
      }

      if (campaignId) router.push(`/campaigns/${campaignId}`)
      else router.push('/campaigns')
    } catch {
      setError('Erro ao criar campanha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/campaigns" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Nova campanha</h1>
        </div>
        <SaveStatus state={saveState} />
      </div>

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Nome da campanha *</label>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Reativação de clientes perdidos"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Segmento</label>
            <select
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            >
              <option value="" className="bg-[#0F0F0F]">Selecionar segmento...</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0F0F0F]">{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Tipo de mensagem</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWriteManual(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!writeManual ? 'bg-[#C9A14A]/15 text-[#C9A14A] border border-[#C9A14A]/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}
              >
                Usar template
              </button>
              <button
                type="button"
                onClick={() => setWriteManual(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${writeManual ? 'bg-[#C9A14A]/15 text-[#C9A14A] border border-[#C9A14A]/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}
              >
                Escrever mensagem
              </button>
            </div>
          </div>

          {writeManual ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Mensagem</label>
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={5}
                placeholder="Digite sua mensagem... Use {{nome}} para personalizar"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors resize-none"
              />
              {manualContent && (
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mt-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pré-visualização</p>
                  <div className="bg-[#005C4B]/20 border border-[#005C4B]/30 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap">
                    {manualContent}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Template de mensagem</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
              >
                <option value="" className="bg-[#0F0F0F]">Selecionar template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0F0F0F]">{t.name}</option>
                ))}
              </select>
              {selectedTemplateId && (() => {
                const tmpl = templates.find((t) => t.id === selectedTemplateId)
                if (!tmpl?.content) return null
                return (
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mt-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pré-visualização</p>
                    <div className="bg-[#005C4B]/20 border border-[#005C4B]/30 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap">
                      {tmpl.content}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Agendamento</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
            <p className="text-xs text-gray-500">Deixe vazio para enviar manualmente depois</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/campaigns"
              className="flex-1 text-center border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#C9A14A] text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : draftId ? (
                'Finalizar campanha'
              ) : (
                'Criar campanha'
              )}
            </button>
          </div>
        </form>
      </div>

      {draftId && (
        <p className="text-xs text-gray-500 text-center mt-3">
          Seu rascunho está salvo automaticamente. Você pode sair e voltar depois.
        </p>
      )}
    </div>
  )
}

function SaveStatus({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <CloudUpload className="h-3.5 w-3.5 animate-pulse" />
        Salvando...
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <Check className="h-3.5 w-3.5" />
        Rascunho salvo
      </span>
    )
  }
  return (
    <span className="text-xs text-red-400">Erro ao salvar</span>
  )
}
