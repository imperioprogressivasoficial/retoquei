'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'REACTIVATION', label: 'Reativação' },
  { value: 'POST_VISIT', label: 'Pós-visita' },
  { value: 'BIRTHDAY', label: 'Aniversário' },
  { value: 'UPSELL', label: 'Upsell' },
  { value: 'CUSTOM', label: 'Personalizado' },
]

export default function NewTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      category: (form.elements.namedItem('category') as HTMLSelectElement).value,
      content: (form.elements.namedItem('content') as HTMLTextAreaElement).value,
    }
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erro ao criar template')
        return
      }
      router.push('/templates')
    } catch {
      setError('Erro ao criar template. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/templates" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Novo template</h1>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Nome do template *</label>
            <input
              name="name"
              required
              placeholder="Ex: Reativação 30 dias"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Categoria *</label>
            <select
              name="category"
              required
              className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#0F0F0F]">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Conteúdo da mensagem *</label>
            <p className="text-xs text-gray-500">Use {'{{nome}}'} para inserir o nome do cliente</p>
            <textarea
              name="content"
              required
              rows={6}
              placeholder="Olá {{nome}}, sentimos sua falta! Que tal agendar um horário?"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/templates"
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
                'Salvar template'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
