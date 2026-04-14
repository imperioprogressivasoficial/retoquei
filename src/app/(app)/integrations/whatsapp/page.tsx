'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Wifi, WifiOff, QrCode, Smartphone } from 'lucide-react'

type State = 'loading' | 'connected' | 'choose' | 'qr' | 'pairing' | 'error' | 'not_configured'
type Method = 'qr' | 'pairing'

export default function WhatsAppConnectionPage() {
  const [state, setState] = useState<State>('loading')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [polling, setPolling] = useState(false)
  const [pairingLoading, setPairingLoading] = useState(false)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status')
      const data = await res.json()
      if (data.connected) {
        setState('connected')
        setPolling(false)
        return true
      }
    } catch { /* ignore */ }
    return false
  }, [])

  const init = useCallback(async () => {
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
      } else {
        setState('choose')
      }
    } catch (e) {
      setState('error')
      setError(String(e))
    }
  }, [])

  const connectQR = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch('/api/whatsapp/qrcode')
      const data = await res.json()

      if (data.connected) {
        setState('connected')
        return
      }

      if (data.qrcode) {
        setQrCode(data.qrcode)
        setState('qr')
        setPolling(true)
      } else {
        setState('error')
        setError('Não foi possível gerar o QR Code.')
      }
    } catch (e) {
      setState('error')
      setError(String(e))
    }
  }, [])

  const connectPairing = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) return
    setPairingLoading(true)
    setError('')
    try {
      const res = await fetch('/api/whatsapp/pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao gerar código')
        setPairingLoading(false)
        return
      }

      setPairingCode(data.code)
      setState('pairing')
      setPolling(true)
    } catch (e) {
      setError(String(e))
    }
    setPairingLoading(false)
  }

  // Poll connection status
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      const connected = await checkStatus()
      if (connected) setPolling(false)
    }, 3000)
    return () => clearInterval(interval)
  }, [polling, checkStatus])

  useEffect(() => { init() }, [init])

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/integrations" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
          <p className="text-gray-400 text-sm">Conecte seu número para enviar mensagens</p>
        </div>
      </div>

      {/* CONNECTED */}
      {state === 'connected' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">WhatsApp conectado!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Seu número está online e pronto para enviar campanhas e automações.
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
          <p className="text-gray-400">Verificando conexão...</p>
        </div>
      )}

      {/* CHOOSE METHOD */}
      {state === 'choose' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400 mb-2">Escolha como deseja conectar:</p>

          <div className="grid grid-cols-2 gap-4">
            {/* QR Code option */}
            <button
              onClick={connectQR}
              className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 text-center hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <QrCode className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">QR Code</h3>
              <p className="text-xs text-gray-500">
                Escaneie com a câmera do seu celular
              </p>
            </button>

            {/* Pairing Code option */}
            <button
              onClick={() => setState('pairing')}
              className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 text-center hover:border-[#C9A14A]/30 hover:bg-white/[0.05] transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#C9A14A]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#C9A14A]/20 transition-colors">
                <Smartphone className="h-7 w-7 text-[#C9A14A]" />
              </div>
              <h3 className="font-semibold text-white mb-1">Código</h3>
              <p className="text-xs text-gray-500">
                Digite um código no seu WhatsApp
              </p>
            </button>
          </div>
        </div>
      )}

      {/* QR CODE */}
      {state === 'qr' && qrCode && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 text-center">
          <h2 className="text-white font-semibold mb-1">Escaneie o QR Code</h2>
          <p className="text-gray-400 text-sm mb-6">
            No celular: WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar aparelho
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

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={connectQR}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Gerar novo QR
            </button>
            <button
              onClick={() => { setState('choose'); setPolling(false) }}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {/* PAIRING CODE */}
      {state === 'pairing' && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          {pairingCode ? (
            <div className="text-center">
              <h2 className="text-white font-semibold mb-1">Digite o código no seu WhatsApp</h2>
              <p className="text-gray-400 text-sm mb-6">
                No celular: WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar aparelho → Conectar com número de telefone
              </p>

              <div className="bg-white/[0.05] border border-white/10 rounded-2xl py-6 px-8 inline-block mb-6">
                <p className="text-3xl font-mono font-bold text-white tracking-[0.3em]">
                  {pairingCode}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-[#C9A14A] text-xs mb-4">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando confirmação no celular...
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => { setPairingCode(null); setPhone(''); setPolling(false) }}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Tentar outro número
                </button>
                <button
                  onClick={() => { setState('choose'); setPolling(false); setPairingCode(null) }}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-white font-semibold mb-1">Conectar com código</h2>
              <p className="text-gray-400 text-sm mb-6">
                Digite o número do WhatsApp que deseja conectar. Enviaremos um código de pareamento.
              </p>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white block mb-1.5">Número com DDD</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Exemplo: 11999999999</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={connectPairing}
                    disabled={pairingLoading || phone.replace(/\D/g, '').length < 10}
                    className="flex-1 bg-[#C9A14A] text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-50"
                  >
                    {pairingLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando código...
                      </span>
                    ) : (
                      'Gerar código de pareamento'
                    )}
                  </button>
                  <button
                    onClick={() => { setState('choose'); setError('') }}
                    className="px-4 py-2.5 text-sm text-gray-500 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          )}
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
        </div>
      )}

      {/* ERROR */}
      {state === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
          <WifiOff className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-4">{error || 'Erro ao conectar'}</p>
          <button
            onClick={init}
            className="bg-[#C9A14A] text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
