'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Webhook, Lock, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Onboarding Wizard — 6-step setup flow
// ---------------------------------------------------------------------------

export default function OnboardingStepPage() {
  const params = useParams()
  const router = useRouter()
  const step = Number(params.step)

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl bg-gold flex items-center justify-center text-[#0B0B0B] font-black text-xl">Q</div>
          <span className="text-white font-semibold text-lg">Retoquei</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1,2,3,4,5,6].map((s) => (
            <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s <= step ? 'bg-gold' : 'bg-border'}`} />
          ))}
        </div>

        {step === 1 && <Step1 onNext={() => router.push('/onboarding/2')} />}
        {step === 2 && <Step2 onNext={() => router.push('/onboarding/3')} />}
        {step === 3 && <Step3 onNext={() => router.push('/onboarding/4')} />}
        {step === 4 && <Step4 onNext={() => router.push('/onboarding/5')} />}
        {step === 5 && <Step5 onNext={() => router.push('/onboarding/6')} />}
        {step === 6 && <Step6 onFinish={() => router.push('/dashboard')} />}
      </div>
    </div>
  )
}

// ── Step 1: Account info ────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState('')

  async function handleNext() {
    if (!name.trim()) return
    const isDevMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
    if (!isDevMode) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name }),
      })
    }
    onNext()
  }

  return (
    <div className="rounded-2xl border border-border bg-[#1E1E1E] p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Bem-vindo ao Retoquei</h1>
        <p className="text-sm text-muted-foreground mt-1">Vamos configurar sua conta em alguns passos</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Seu nome completo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ana Costa"
            className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
        </div>
      </div>
      <button
        onClick={handleNext}
        disabled={!name.trim()}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors disabled:opacity-50"
      >
        Continuar <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Step 2: Create workspace ────────────────────────────────────────────────

function Step2({ onNext }: { onNext: () => void }) {
  const [salonName, setSalonName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleNext() {
    if (!salonName.trim()) return
    setLoading(true)
    setError('')
    try {
      const isDevMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      if (!isDevMode) {
        const slug = salonName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50)
        const res = await fetch('/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: salonName, slug }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
      }
      onNext()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-[#1E1E1E] p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Crie seu espaço de trabalho</h1>
        <p className="text-sm text-muted-foreground mt-1">Cada salão tem seu próprio espaço no Retoquei</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Nome do salão</label>
          <input
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
            placeholder="Salão Aurora"
            className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      <button
        onClick={handleNext}
        disabled={!salonName.trim() || loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Criar espaço</span><ArrowRight className="h-4 w-4" /></>}
      </button>
    </div>
  )
}

// ── Step 3: Connect booking system (CRITICAL GATE) ─────────────────────────

function Step3({ onNext }: { onNext: () => void }) {
  const router = useRouter()
  const isDevMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

  function handleCSV() {
    if (isDevMode) {
      // In dev mode, set has_connector = true and skip to step 4
      const existing = document.cookie.split(';').find(c => c.trim().startsWith('dev_user='))
      const val = existing ? JSON.parse(decodeURIComponent(existing.split('=')[1])) : { id: 'dev-user', email: 'dev@retoquei.com' }
      val.user_metadata = { ...val.user_metadata, has_connector: true }
      document.cookie = `dev_user=${encodeURIComponent(JSON.stringify(val))};path=/`
      onNext()
      return
    }
    router.push('/integrations/csv')
  }

  return (
    <div className="rounded-2xl border border-border bg-[#1E1E1E] p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Conecte sua plataforma de agendamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O Retoquei precisa de uma fonte de dados de agendamentos para funcionar.
          Esta etapa é obrigatória.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleCSV}
          className="w-full flex items-center gap-4 rounded-xl border border-border bg-[#161616] p-4 hover:border-gold/30 hover:bg-gold/5 transition-all text-left group"
        >
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors">Importação via CSV</p>
            <p className="text-xs text-muted-foreground">Faça upload de uma planilha com seus clientes e agendamentos</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-gold" />
        </button>

        <button
          onClick={() => router.push('/integrations')}
          className="w-full flex items-center gap-4 rounded-xl border border-border bg-[#161616] p-4 hover:border-gold/30 hover:bg-gold/5 transition-all text-left group"
        >
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <Webhook className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors">Webhook / API</p>
            <p className="text-xs text-muted-foreground">Conecte qualquer plataforma via API ou webhook</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-gold" />
        </button>

        <div className="w-full flex items-center gap-4 rounded-xl border border-dashed border-border bg-[#161616] p-4 opacity-50 cursor-not-allowed">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Trinks</p>
            <p className="text-xs text-muted-foreground">Em breve — integração nativa</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        <p className="text-xs text-amber-400">
          ⚠️ Você não poderá acessar o dashboard sem conectar uma plataforma de agendamentos.
        </p>
      </div>
    </div>
  )
}

// ── Step 4: Import data ──────────────────────────────────────────────────

function Step4({ onNext }: { onNext: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-[#1E1E1E] p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Importe seus dados</h1>
        <p className="text-sm text-muted-foreground mt-1">Seus clientes e agendamentos serão importados automaticamente</p>
      </div>
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Conector configurado!</p>
            <p className="text-xs text-muted-foreground mt-0.5">Seus dados serão sincronizados automaticamente</p>
          </div>
        </div>
      </div>
      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
      >
        Continuar <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Step 5: WhatsApp ─────────────────────────────────────────────────────

function Step5({ onNext }: { onNext: () => void }) {
  const [useSandbox, setUseSandbox] = useState(true)

  return (
    <div className="rounded-2xl border border-border bg-[#1E1E1E] p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Conecte o WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure a API do WhatsApp para envio de mensagens</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setUseSandbox(true)}
          className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${useSandbox ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/30'}`}
        >
          <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${useSandbox ? 'border-gold' : 'border-border'}`}>
            {useSandbox && <div className="h-2 w-2 rounded-full bg-gold" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Modo Sandbox (recomendado para testes)</p>
            <p className="text-xs text-muted-foreground">Mensagens serão logadas no console. Nenhuma API real necessária.</p>
          </div>
        </button>

        <button
          onClick={() => setUseSandbox(false)}
          className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${!useSandbox ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/30'}`}
        >
          <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${!useSandbox ? 'border-gold' : 'border-border'}`}>
            {!useSandbox && <div className="h-2 w-2 rounded-full bg-gold" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Meta WhatsApp Cloud API</p>
            <p className="text-xs text-muted-foreground">Configure WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN no .env</p>
          </div>
        </button>
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
      >
        Continuar <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Step 6: Ready ────────────────────────────────────────────────────────

function Step6({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-[#1E1E1E] p-8 space-y-6 text-center">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-gold/15 flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-gold" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white">Tudo pronto!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seu Retoquei está configurado. Acesse o dashboard e comece a entender o comportamento dos seus clientes.
        </p>
      </div>
      <button
        onClick={onFinish}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
      >
        Ir para o Dashboard <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}
