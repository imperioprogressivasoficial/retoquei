'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Lock, CheckCircle, ArrowRight, Loader2, Smartphone, RefreshCw, ExternalLink, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { RetoqueiLogoMark } from '@/components/ui/RetoqueiLogo'

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
          <RetoqueiLogoMark size={36} />
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

// ── Step 3: Connect booking system (optional) ──────────────────────────────

function Step3({ onNext }: { onNext: () => void }) {
  const router = useRouter()

  function handleCSV() {
    router.push('/integrations/csv')
  }

  return (
    <div className="rounded-2xl border border-border bg-[#1E1E1E] p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Conecte sua fonte de dados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Importe seus clientes e agendamentos. Você pode fazer isso agora ou depois.
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

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
      >
        Pular, conectar depois
      </button>
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

// ── Step 5: WhatsApp via QR code ─────────────────────────────────────────

function Step5({ onNext }: { onNext: () => void }) {
  const [qrBase64, setQrBase64] = useState<string | null>(null)
  const [loadingQR, setLoadingQR] = useState(false)
  const [connected, setConnected] = useState(false)
  const [qrError, setQrError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status', { cache: 'no-store' })
      const data = await res.json() as { state: string }
      if (data.state === 'open') {
        setConnected(true)
        setQrBase64(null)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    checkStatus()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [checkStatus])

  async function handleGetQR() {
    setLoadingQR(true)
    setQrError('')
    try {
      const res = await fetch('/api/whatsapp/qr', { cache: 'no-store' })
      const data = await res.json() as { base64?: string; error?: string }
      if (data.error) { setQrError(data.error); return }
      setQrBase64(data.base64 ?? null)
      // Poll status every 3s while waiting for scan
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(checkStatus, 3000)
    } catch (e) {
      setQrError((e as Error).message)
    } finally {
      setLoadingQR(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-[#1E1E1E] p-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Conecte o WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escaneie o QR code com seu WhatsApp para enviar mensagens automaticamente
        </p>
      </div>

      {connected ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">WhatsApp conectado!</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pronto para enviar mensagens automáticas</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* QR Code display */}
          <div className="flex justify-center">
            {loadingQR ? (
              <div className="h-48 w-48 rounded-xl border border-border flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : qrBase64 ? (
              <div className="rounded-xl border-2 border-gold/40 p-2.5 bg-white inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrBase64} alt="WhatsApp QR Code" className="h-44 w-44" />
              </div>
            ) : (
              <div className="h-48 w-48 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
                <Smartphone className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground text-center px-2">
                  Clique para gerar o QR code
                </p>
              </div>
            )}
          </div>

          {qrError && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 space-y-1">
              <p>{qrError}</p>
              <a href="https://doc.evolution-api.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gold hover:underline">
                Configurar Evolution API <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <button
            onClick={handleGetQR}
            disabled={loadingQR}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm text-white hover:border-gold/40 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {loadingQR ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {qrBase64 ? 'Atualizar QR Code' : 'Gerar QR Code'}
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            Abra o WhatsApp → Configurações → Dispositivos conectados → Conectar dispositivo
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onNext}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${connected ? 'bg-gold text-[#0B0B0B] hover:bg-gold/90' : 'border border-border text-muted-foreground hover:text-white hover:border-white/20'}`}
        >
          {connected ? <><CheckCircle2 className="h-4 w-4" />Continuar</> : <>Pular, conectar depois <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </div>
  )
}

// ── Step 6: Ready ────────────────────────────────────────────────────────

function Step6({ onFinish }: { onFinish: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinish() {
    setLoading(true)
    setError(null)
    try {
      // Mark onboarding as complete (tenant already created in Step 2)
      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingComplete: true }),
      })

      onFinish()
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

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
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        onClick={handleFinish}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Ir para o Dashboard</span><ArrowRight className="h-4 w-4" /></>}
      </button>
    </div>
  )
}
