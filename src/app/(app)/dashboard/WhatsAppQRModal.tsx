'use client'

import { useState, useEffect } from 'react'
import { X, QrCode, CheckCircle, AlertCircle } from 'lucide-react'

interface QRData {
  status: 'connected' | 'waiting' | 'initializing' | 'error'
  qr: string | null
  message: string
}

export default function WhatsAppQRModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    async function fetchQR() {
      setLoading(true)
      try {
        const res = await fetch('/api/whatsapp/qr')
        if (res.ok) {
          const data = await res.json()
          setQrData(data)
        }
      } catch (err) {
        console.error('Error fetching QR:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQR()

    // Refresh QR every 5 seconds
    const interval = setInterval(fetchQR, 5000)
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors text-sm font-medium border border-green-500/30"
      >
        <QrCode className="h-4 w-4" />
        Conectar WhatsApp
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1A1A1A] rounded-lg border border-white/[0.08] p-8 max-w-md w-full mx-4">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-6">Conectar WhatsApp</h2>

        {/* Status */}
        {qrData && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              {qrData.status === 'connected' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Conectado!</span>
                </>
              ) : qrData.status === 'waiting' ? (
                <>
                  <QrCode className="h-5 w-5 text-blue-400 animate-pulse" />
                  <span className="text-blue-400 font-semibold">Aguardando código QR</span>
                </>
              ) : qrData.status === 'initializing' ? (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 font-semibold">Conectando...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 font-semibold">Erro na conexão</span>
                </>
              )}
            </div>

            <p className="text-sm text-gray-400 mb-6">{qrData.message}</p>

            {/* QR Code */}
            {qrData.qr && qrData.status === 'waiting' && (
              <div className="bg-white p-4 rounded-lg mb-6">
                <img
                  src={qrData.qr}
                  alt="QR Code"
                  className="w-full"
                />
              </div>
            )}

            {/* Instructions */}
            {qrData.status === 'waiting' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
                <p className="font-semibold mb-2">Como conectar:</p>
                <ol className="space-y-1 text-xs">
                  <li>1. Abra o WhatsApp no seu telefone</li>
                  <li>2. Toque em Configurações → Dispositivos Vinculados</li>
                  <li>3. Aponte a câmera para o código QR acima</li>
                  <li>4. Pronto! Você pode fechar este modal</li>
                </ol>
              </div>
            )}

            {/* Connected state */}
            {qrData.status === 'connected' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-sm text-green-300">
                <p className="font-semibold mb-2">✅ Conectado com sucesso!</p>
                <p className="text-xs">
                  Você pode agora enviar mensagens para clientes via WhatsApp.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">
              <QrCode className="h-6 w-6 text-[#C9A14A]" />
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="w-full bg-[#C9A14A] text-black font-semibold py-2.5 rounded-lg hover:bg-[#b8903e] transition-colors mt-6"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
