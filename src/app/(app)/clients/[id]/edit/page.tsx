'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface ClientData {
  id: string
  fullName: string
  phone: string
  email: string | null
  notes: string | null
}

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then((data) => setClient(data.client ?? data))
      .catch(() => setError('Erro ao carregar cliente'))
      .finally(() => setFetching(false))
  }, [clientId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = {
      fullName: (form.elements.namedItem('fullName') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value || undefined,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value || undefined,
    }
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erro ao salvar')
        return
      }
      router.push(`/clients/${clientId}`)
      router.refresh()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#C9A14A]" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-lg">
        <p className="text-gray-400">Cliente não encontrado.</p>
        <Link href="/clients" className="text-[#C9A14A] hover:underline text-sm mt-2 inline-block">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/clients/${clientId}`} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Editar cliente</h1>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Nome completo *</label>
            <input
              name="fullName"
              required
              defaultValue={client.fullName}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Telefone / WhatsApp *</label>
            <input
              name="phone"
              required
              defaultValue={client.phone}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">E-mail</label>
            <input
              name="email"
              type="email"
              defaultValue={client.email ?? ''}
              placeholder="joao@email.com"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Observações</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={client.notes ?? ''}
              placeholder="Anotações sobre o cliente..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href={`/clients/${clientId}`}
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
                'Salvar alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
