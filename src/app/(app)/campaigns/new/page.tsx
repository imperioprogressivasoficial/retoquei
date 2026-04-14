'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Segment { id: string; name: string }
interface Template { id: string; name: string; content: string }

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [segments, setSegments] = useState<Segment[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/segments').then((r) => r.json()),
      fetch('/api/templates').then((r) => r.json()),
    ]).then(([sData, tData]) => {
      setSegments(sData.segments ?? [])
      setTemplates(tData.templates ?? [])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      segmentId: (form.elements.namedItem('segmentId') as HTMLSelectElement).value || undefined,
      templateId: (form.elements.namedItem('templateId') as HTMLSelectElement).value || undefined,
    }
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erro ao criar campanha')
        return
      }
      // Redirect to detail page so user can dispatch immediately
      const campaignId = json.campaign?.id
      if (campaignId) {
        router.push(`/campaigns/${campaignId}`)
      } else {
        router.push('/campaigns')
      }
    } catch {
      setError('Erro ao criar campanha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/campaigns" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Nova campanha</h1>
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
              required
              placeholder="Ex: Reativação de clientes perdidos"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Segmento</label>
            <select
              name="segmentId"
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            >
              <option value="" className="bg-[#0F0F0F]">Selecionar segmento...</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0F0F0F]">{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Template de mensagem</label>
            <select
              name="templateId"
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
              ) : (
                'Criar campanha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
