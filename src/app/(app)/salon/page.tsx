'use client'

import { useState, useEffect } from 'react'
import { Loader2, Store, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Salon {
  id: string
  name: string
  slug: string
  phone: string | null
  email: string | null
}

export default function SalonPage() {
  const [tab, setTab] = useState<'salon' | 'account'>('salon')
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/salons')
      .then((r) => r.json())
      .then((d) => {
        setSalon(d.salon ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
      setUserId(data.user?.id ?? null)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value || undefined,
      email: (form.elements.namedItem('email') as HTMLInputElement).value || undefined,
    }

    try {
      const method = salon ? 'PUT' : 'POST'
      const res = await fetch('/api/salons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erro ao salvar')
        return
      }
      const json = await res.json()
      setSalon(json.salon)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#C9A14A]" />
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 mt-1">Gerencie sua empresa e sua conta</p>
      </div>

      <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.08] rounded-lg p-1">
        <button
          onClick={() => setTab('salon')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'salon' ? 'bg-[#C9A14A]/15 text-[#C9A14A]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Store className="h-4 w-4" /> Empresa
        </button>
        <button
          onClick={() => setTab('account')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'account' ? 'bg-[#C9A14A]/15 text-[#C9A14A]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <User className="h-4 w-4" /> Conta
        </button>
      </div>

      {tab === 'account' && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">E-mail da conta</p>
            <p className="text-white text-sm">{userEmail ?? '...'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">ID do usuário</p>
            <p className="text-gray-400 text-xs font-mono">{userId ?? '...'}</p>
          </div>
          <div className="pt-2 border-t border-white/[0.06]">
            <p className="text-sm text-gray-500">
              Para alterar e-mail ou senha, acesse as configurações da sua conta no painel de autenticação.
            </p>
          </div>
        </div>
      )}

      {tab === 'salon' && !salon && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-[#C9A14A]/5 border border-[#C9A14A]/20 rounded-xl">
          <Store className="h-5 w-5 text-[#C9A14A] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#C9A14A]">Configure sua empresa</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Preencha as informações abaixo para começar a usar o Retoquei.
            </p>
          </div>
        </div>
      )}

      {tab === 'salon' && (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
              Salvo com sucesso!
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Nome da empresa *</label>
            <input
              name="name"
              required
              defaultValue={salon?.name ?? ''}
              placeholder="Ex: Studio da Mari"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Telefone</label>
            <input
              name="phone"
              defaultValue={salon?.phone ?? ''}
              placeholder="(11) 99999-9999"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">E-mail da empresa</label>
            <input
              name="email"
              type="email"
              defaultValue={salon?.email ?? ''}
              placeholder="contato@minhaempresa.com.br"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#C9A14A] text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60 mt-2"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              salon ? 'Salvar alterações' : 'Criar empresa'
            )}
          </button>
        </form>
      </div>
      )}
    </div>
  )
}
