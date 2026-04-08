'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react'

type State = 'loading' | 'connected' | 'qr' | 'error' | 'not_configured'

export default function WhatsAppConnectionPage() {
  const [state, setState] = useState<State>('loading')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [polling, setPolling] = useState(false)

  const fetchQR = useCallback(async () => {
    setState('loading')
    setError('')
    try {
      const res = await fetch('/api/whatsapp/qrcode')
      const data = await res.json()

      if (!res.ok) {
        if (data.error?.includes('não configurada')) {
          setState('not_configured')
        } else {
          setState('error')
          setError(data.error ?? 'Erro desconhecido')
        }
        return
      }

      if (data.connected) {
        setState('connected')
        setPolling(false)
      } else if (data.qrcode) {
        setQrCode(data.qrcode)
        setState('qr')
        setPolling(true)
      }
    } catch (e) {
      setState('error')
      setError(String(e))
    }
  }, [])

  // Poll status while showing QR
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/whatsapp/status')
        const data = await res.json()
        if (data.connected) {
          setState('connected')
          setPolling(false)
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [polling])

  useEffect(() => {
    fetchQR()
  }, [fetchQR])

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/integrations" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
          <p className="text-gray-400 text-sm">Conecte via QR Code (igual WhatsApp Web)</p>
        </div>
      </div>

      {/* CONNECTED */}
      {state === 'connected' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">WhatsApp Conectado!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Seu número está online e pronto para enviar mensagens.
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
            <Wifi className="h-4 w-4" />
            Online
          </div>
        </div>
      )}

      {/* LOADING */}
      {state === 'loading' && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-12 text-center">
          <Loader2 className="h-10 w-10 text-[#C9A14A] mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Gerando QR Code...</p>
        </div>
      )}

      {/* QR CODE */}
      {state === 'qr' && qrCode && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 text-center">
          <h2 className="text-white font-semibold mb-1">Escaneie o QR Code</h2>
          <p className="text-gray-400 text-sm mb-6">
            Abra o WhatsApp no celular → Menu → Aparelhos conectados → Conectar aparelho
          </p>

          <div className="bg-white rounded-2xl p-4 inline-block mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
              alt="QR Code WhatsApp"
              className="w-56 h-56"
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-[#C9A14A] text-xs mb-4">
            <Loader2 className="h-3 w-3 animate-spin" />
            Aguardando escaneamento...
          </div>

          <button
            onClick={fetchQR}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mx-auto transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            QR Code expirou? Clique para gerar novo
          </button>
        </div>
      )}

      {/* NOT CONFIGURED */}
      {state === 'not_configured' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
          <WifiOff className="h-10 w-10 text-yellow-400 mb-4" />
          <h2 className="text-white font-semibold mb-2">Evolution API não configurada</h2>
          <p className="text-gray-400 text-sm mb-4">
            Adicione as variáveis abaixo no seu <code className="text-yellow-400">.env.local</code>:
          </p>
          <code className="block bg-black/30 rounded-lg p-4 text-xs text-gray-300 font-mono leading-relaxed">
            EVOLUTION_API_URL=https://sua-evolution.railway.app<br />
            EVOLUTION_API_KEY=sua-chave-aqui<br />
            EVOLUTION_INSTANCE_NAME=retoquei
          </code>
          <p className="text-xs text-gray-500 mt-4">
            Após configurar, reinicie o servidor e volte aqui.
          </p>
        </div>
      )}

      {/* ERROR */}
      {state === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
          <WifiOff className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-4">{error || 'Erro ao conectar com a Evolution API'}</p>
          <button
            onClick={fetchQR}
            className="bg-[#C9A14A] text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Instructions */}
      {(state === 'qr' || state === 'not_configured') && (
        <div className="mt-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Como funciona</h3>
          <ol className="space-y-2 text-xs text-gray-500 list-none">
            {[
              'Você hospeda a Evolution API (Railway, grátis)',
              'Cola a URL e chave no .env.local',
              'Escaneia o QR Code com seu WhatsApp',
              'Pronto — mensagens são enviadas pelo seu número',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#C9A14A] font-bold">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
