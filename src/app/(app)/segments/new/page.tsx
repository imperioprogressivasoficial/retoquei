'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Users, Zap, CheckCircle } from 'lucide-react'

type SegmentType = 'MANUAL' | 'DYNAMIC'

export default function NewSegmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState<SegmentType>('MANUAL')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      description: (form.elements.namedItem('description') as HTMLInputElement).value || undefined,
      type: selectedType,
    }
    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erro ao criar segmento')
        return
      }
      router.push('/segments')
    } catch {
      setError('Erro ao criar segmento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/segments" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Criar novo segmento</h1>
          <p className="text-sm text-gray-400 mt-1">Agrupe clientes por critérios</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Tipo de Segmento - Visual Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white">Como você quer criar? *</label>
          <p className="text-xs text-gray-400">Escolha o método que faz sentido para você</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* MANUAL Option */}
            <button
              type="button"
              onClick={() => setSelectedType('MANUAL')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedType === 'MANUAL'
                  ? 'border-[#C9A14A] bg-[#C9A14A]/10'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-start gap-3">
                <Users className={`h-5 w-5 mt-0.5 shrink-0 ${selectedType === 'MANUAL' ? 'text-[#C9A14A]' : 'text-gray-500'}`} />
                <div className="flex-1">
                  <p className="font-semibold text-white">Seleção Manual</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Você escolhe quais clientes fazem parte do segmento
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <p>✓ Simples e rápido</p>
                    <p>✓ Controle total</p>
                  </div>
                </div>
              </div>
            </button>

            {/* DYNAMIC Option */}
            <button
              type="button"
              onClick={() => setSelectedType('DYNAMIC')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedType === 'DYNAMIC'
                  ? 'border-[#C9A14A] bg-[#C9A14A]/10'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-start gap-3">
                <Zap className={`h-5 w-5 mt-0.5 shrink-0 ${selectedType === 'DYNAMIC' ? 'text-[#C9A14A]' : 'text-gray-500'}`} />
                <div className="flex-1">
                  <p className="font-semibold text-white">Automático (Dinâmico)</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Sistema agrupa automaticamente por critérios
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <p>✓ Atualiza automaticamente</p>
                    <p>✓ Baseado em regras (futuro)</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">
                {selectedType === 'MANUAL' ? 'Seleção Manual' : 'Automático'}
              </p>
              <p className="text-xs">
                {selectedType === 'MANUAL'
                  ? 'Você escolhe os clientes. Ideal para pequenos grupos ou estratégias específicas.'
                  : 'O sistema encontra automaticamente clientes que combinam com critérios. Atualiza sempre que novos clientes chegam.'}
              </p>
            </div>
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Nome do Segmento *</label>
          <input
            name="name"
            required
            placeholder={selectedType === 'MANUAL' ? 'Ex: VIPs preferidos' : 'Ex: Clientes em risco'}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Descrição (opcional)</label>
          <textarea
            name="description"
            placeholder={
              selectedType === 'MANUAL'
                ? 'Ex: Clientes que mais gastam, necessitam atendimento VIP'
                : 'Ex: Clientes que não visitam há mais de 90 dias'
            }
            rows={3}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Link
            href="/segments"
            className="flex-1 text-center border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm transition-colors font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#C9A14A] text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar segmento'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
