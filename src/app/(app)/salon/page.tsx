'use client'

import { useState, useEffect } from 'react'
import { Loader2, Building2, User, KeyRound, CheckCircle2, MessageCircle } from 'lucide-react'
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
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  // Password reset
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  // WhatsApp login phone
  const [profilePhone, setProfilePhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

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
      setCreatedAt(data.user?.created_at ?? null)
    })

    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.phone) setProfilePhone(d.profile.phone)
      })
      .catch(() => { /* ignore */ })
  }, [])

  async function handleProfileSave() {
    setProfileSaving(true)
    setProfileError('')
    setProfileSaved(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: profilePhone || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        setProfileError(json.error ?? 'Erro ao salvar')
        return
      }
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch {
      setProfileError('Erro de rede')
    } finally {
      setProfileSaving(false)
    }
  }

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

  async function handlePasswordReset() {
    if (!userEmail) return
    setResetLoading(true)
    setResetError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        setResetError(error.message)
      } else {
        setResetSent(true)
        setTimeout(() => setResetSent(false), 5000)
      }
    } catch {
      setResetError('Erro ao enviar e-mail. Tente novamente.')
    } finally {
      setResetLoading(false)
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.08] rounded-lg p-1">
        <button
          onClick={() => setTab('salon')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'salon' ? 'bg-[#C9A14A]/15 text-[#C9A14A]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4" /> Empresa
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

      {/* ── Tab Empresa ── */}
      {tab === 'salon' && (
        <div className="space-y-4">
          {!salon && (
            <div className="flex items-start gap-3 p-4 bg-[#C9A14A]/5 border border-[#C9A14A]/20 rounded-xl">
              <Building2 className="h-5 w-5 text-[#C9A14A] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#C9A14A]">Configure sua empresa</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Preencha as informações abaixo para começar a usar o Retoquei.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Salvo com sucesso!
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
                <label className="text-sm font-medium text-white">Telefone / WhatsApp</label>
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

              {salon && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white">Slug (URL)</label>
                  <div className="w-full bg-white/[0.02] border border-white/[0.06] text-gray-500 rounded-lg py-2.5 px-3 text-sm font-mono">
                    {salon.slug}
                  </div>
                  <p className="text-xs text-gray-400">O slug é gerado automaticamente e não pode ser alterado.</p>
                </div>
              )}

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
        </div>
      )}

      {/* ── Tab Conta ── */}
      {tab === 'account' && (
        <div className="space-y-4">
          {/* Informações da conta */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">Informações da conta</h2>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">E-mail</p>
              <p className="text-white text-sm">{userEmail ?? '...'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Membro desde</p>
              <p className="text-gray-300 text-sm">
                {createdAt ? new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">ID da conta</p>
              <p className="text-gray-500 text-xs font-mono break-all">{userId ?? '...'}</p>
            </div>
          </div>

          {/* WhatsApp para login */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <MessageCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">WhatsApp para login</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure para poder entrar sem senha, recebendo um código pelo WhatsApp.
                </p>
              </div>
            </div>

            {profileError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-3">
                {profileError}
              </div>
            )}

            {profileSaved && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                WhatsApp salvo com sucesso!
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">
                  Número com DDD
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Exemplo: 11999999999. Este número vai receber seu código de acesso.
                </p>
              </div>

              <button
                onClick={handleProfileSave}
                disabled={profileSaving}
                className="w-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {profileSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                ) : (
                  <>Salvar WhatsApp</>
                )}
              </button>
            </div>
          </div>

          {/* Alterar senha */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <KeyRound className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">Alterar senha</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enviaremos um link de redefinição para o seu e-mail.
                </p>
              </div>
            </div>

            {resetError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-3">
                {resetError}
              </div>
            )}

            {resetSent ? (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                E-mail enviado! Verifique sua caixa de entrada.
              </div>
            ) : (
              <button
                onClick={handlePasswordReset}
                disabled={resetLoading || !userEmail}
                className="w-full border border-white/10 text-gray-300 hover:text-white hover:border-white/20 font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <>Enviar link de redefinição</>
                )}
              </button>
            )}
          </div>

          {/* Zona de perigo */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-red-400 mb-1">Zona de risco</h2>
            <p className="text-xs text-gray-500 mb-4">
              Para excluir sua conta e todos os dados, entre em contato com o suporte.
            </p>
            <a
              href="https://wa.me/5511999999999?text=Quero%20excluir%20minha%20conta%20do%20Retoquei"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
            >
              Solicitar exclusão de conta →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
