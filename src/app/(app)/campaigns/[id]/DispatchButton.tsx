'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'

interface Props {
  campaignId: string
  targetCount: number
}

export default function DispatchButton({ campaignId, targetCount }: Props) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDispatch() {
    if (sending) return
    const confirmed = window.confirm(
      `Enviar mensagem para ${targetCount} cliente${targetCount === 1 ? '' : 's'}?\n\nEsta ação não pode ser desfeita.`,
    )
    if (!confirmed) return

    setSending(true)
    setError(null)

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/dispatch`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || data.message || 'Erro ao enviar')
        setSending(false)
        return
      }

      alert(
        `Campanha enviada!\n\n` +
          `Provedor: ${data.provider}\n` +
          `Total: ${data.totalCount}\n` +
          `Enviadas: ${data.sentCount}\n` +
          `Falhas: ${data.failedCount}`,
      )
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Erro de rede')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleDispatch}
        disabled={sending || targetCount === 0}
        className="flex items-center gap-2 bg-[#C9A14A] text-black font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Enviar campanha
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-400 max-w-xs text-right">{error}</p>}
    </div>
  )
}
