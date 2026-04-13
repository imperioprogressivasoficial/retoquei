'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeleteButton({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (deleting) return
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta campanha?\n\nEsta ação não pode ser desfeita.',
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
        setDeleting(false)
        return
      }
      router.push('/campaigns')
      router.refresh()
    } catch {
      alert('Erro de rede ao excluir')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-2 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-lg text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      Excluir
    </button>
  )
}
