'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Store } from 'lucide-react'

export default function OnboardingPage() {
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
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value || undefined,
    }
    try {
      const res = await fetch('/api/salons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erro ao criar salão')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Erro ao criar salão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#C9A14A]/20 flex items-center justify-center mb-4">
            <Store className="h-6 w-6 text-[#C9A14A]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Configure seu salão</h1>
          <p className="mt-2 text-sm text-gray-400 text-center">
            Estamos quase lá! Dê um nome ao seu estabelecimento para começar.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Nome do salão *</label>
              <input
                name="name"
                required
                placeholder="Ex: Studio da Mari"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Telefone do salão</label>
              <input
                name="phone"
                placeholder="(11) 99999-9999"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A14A] text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </span>
              ) : (
                'Criar meu salão →'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
