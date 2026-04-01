'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Smartphone, RefreshCw, CheckCircle2, XCircle, Loader2,
  Wifi, WifiOff, ExternalLink, AlertTriangle, Power,
} from 'lucide-react'
import Link from 'next/link'

type ConnectionState = 'open' | 'close' | 'connecting' | 'not_configured'

interface StatusResponse {
  state: ConnectionState
  instance?: string
  number?: string
  configured: boolean
  metaConfigured?: boolean
}

interface QRResponse {
  base64?: string
  code?: string
  error?: string
}

export default function WhatsAppConnectionPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [qr, setQR] = useState<QRResponse | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingQR, setLoadingQR] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status', { cache: 'no-store' })
      const data: StatusResponse = await res.json()
      setStatus(data)
      // If connected, stop polling and hide QR
      if (data.state === 'open') {
        setQR(null)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  const fetchQR = useCallback(async () => {
    setLoadingQR(true)
    setQR(null)
    try {
      const res = await fetch('/api/whatsapp/qr', { cache: 'no-store' })
      const data: QRResponse = await res.json()
      setQR(data)
    } finally {
      setLoadingQR(false)
    }
    // Poll status every 3 seconds while showing QR
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchStatus, 3000)
  }, [fetchStatus])

  useEffect(() => {
    fetchStatus()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchStatus])

  async function handleDisconnect() {
    if (!confirm('Desconectar o WhatsApp?')) return
    setDisconnecting(true)
    await fetch('/api/whatsapp/disconnect', { method: 'POST' })
    setDisconnecting(false)
    setQR(null)
    await fetchStatus()
  }

  const isConnected = status?.state === 'open'
  const isConnecting = status?.state === 'connecting'

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-white">Conexão WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conecte seu WhatsApp para enviar mensagens automáticas aos clientes
        </p>
      </div>

      {/* Status card */}
      <div className={`rounded-xl border p-5 ${isConnected ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-[#1E1E1E]'}`}>
        {loadingStatus ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Verificando conexão...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              ) : isConnecting ? (
                <Loader2 className="h-5 w-5 animate-spin text-amber-400 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {isConnected ? 'Conectado' : isConnecting ? 'Conectando...' : 'Desconectado'}
                </p>
                {isConnected && status?.number && (
                  <p className="text-xs text-green-400 mt-0.5">{status.number}</p>
                )}
                {!isConnected && !isConnecting && (
                  <p className="text-xs text-muted-foreground mt-0.5">Nenhum WhatsApp conectado</p>
                )}
              </div>
            </div>
            {isConnected && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                Desconectar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Not configured warning */}
      {status && !status.configured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Evolution API não configurada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Para conectar via QR code, configure a Evolution API (open-source, gratuita).
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-black/30 p-3 text-xs font-mono text-muted-foreground space-y-1">
            <p className="text-white/60"># Adicione ao .env:</p>
            <p>EVOLUTION_API_URL=https://sua-evolution-api.com</p>
            <p>EVOLUTION_API_KEY=sua-chave-api</p>
          </div>
          <a
            href="https://doc.evolution-api.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
          >
            Ver documentação da Evolution API <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Meta WhatsApp Cloud API configured */}
      {status?.metaConfigured && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 flex items-start gap-3">
          <Wifi className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Meta WhatsApp Cloud API configurada</p>
            <p className="text-xs text-muted-foreground mt-1">
              WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID detectados. Campanhas usarão a API oficial da Meta.
            </p>
          </div>
        </div>
      )}

      {/* QR Code section */}
      {!isConnected && status?.configured && (
        <div className="rounded-xl border border-border bg-[#1E1E1E] p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-white">Conectar via QR Code</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Abra o WhatsApp → Configurações → Dispositivos conectados → Conectar dispositivo → Escaneie o QR code abaixo
            </p>
          </div>

          {/* QR code display */}
          <div className="flex justify-center">
            {loadingQR ? (
              <div className="h-56 w-56 rounded-xl border border-border flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : qr?.base64 ? (
              <div className="space-y-3 text-center">
                <div className="rounded-xl border-2 border-gold/30 p-3 bg-white inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr.base64} alt="WhatsApp QR Code" className="h-48 w-48" />
                </div>
                <p className="text-xs text-muted-foreground">QR code expira em ~60 segundos</p>
              </div>
            ) : qr?.error ? (
              <div className="h-56 w-56 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center p-4 text-center gap-2">
                <WifiOff className="h-8 w-8 text-red-400" />
                <p className="text-xs text-red-400">{qr.error}</p>
              </div>
            ) : (
              <div className="h-56 w-56 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
                <Smartphone className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground text-center">
                  Clique em "Gerar QR Code" para conectar
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchQR}
              disabled={loadingQR}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 disabled:opacity-50 transition-colors"
            >
              {loadingQR ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              {qr?.base64 ? 'Atualizar QR Code' : 'Gerar QR Code'}
            </button>
            {qr?.base64 && (
              <button
                onClick={() => { setQR(null); if (pollRef.current) clearInterval(pollRef.current) }}
                className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-xl border border-border bg-[#1E1E1E] p-5 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Como funciona</h3>
        <ol className="space-y-2.5">
          {[
            'Configure a Evolution API (ou use a Meta WhatsApp Cloud API)',
            'Clique em "Gerar QR Code"',
            'Abra o WhatsApp no celular → Configurações → Dispositivos conectados',
            'Toque em "Conectar dispositivo" e escaneie o QR code',
            'Pronto! As campanhas serão enviadas automaticamente',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold font-bold text-[10px]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="text-xs text-muted-foreground">
        Precisa de ajuda?{' '}
        <Link href="/contact" className="text-gold hover:underline">Fale conosco</Link>
        {' '}ou consulte{' '}
        <a href="https://doc.evolution-api.com" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
          a documentação
        </a>
        .
      </div>
    </div>
  )
}
