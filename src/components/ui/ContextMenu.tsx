'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Archive, Loader2 } from 'lucide-react'

interface ContextMenuProps {
  /** Resource type for API call — e.g. "campaigns", "segments" */
  resource: string
  /** The id of the record */
  id: string
  /** Edit URL — navigates when "Editar" is clicked */
  editUrl?: string
  /** Callback after successful delete (defaults to router.refresh) */
  onDeleted?: () => void
  /** Callback after successful archive (defaults to router.refresh) */
  onArchived?: () => void
  /** Whether this item is currently archived */
  isArchived?: boolean
  children: React.ReactNode
}

export default function ContextMenu({
  resource,
  id,
  editUrl,
  onDeleted,
  onArchived,
  isArchived = false,
  children,
}: ContextMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Position the menu at the cursor
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setOpen(true)
  }

  async function handleDelete() {
    const confirmed = window.confirm('Tem certeza que deseja apagar? Esta ação não pode ser desfeita.')
    if (!confirmed) return
    setLoading('delete')
    try {
      const res = await fetch(`/api/${resource}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Erro ao apagar')
      } else {
        if (onDeleted) onDeleted()
        else router.refresh()
      }
    } catch {
      alert('Erro de rede')
    }
    setLoading(null)
    setOpen(false)
  }

  async function handleArchive() {
    setLoading('archive')
    try {
      const res = await fetch(`/api/${resource}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isArchived ? 'unarchive' : 'archive' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Erro ao arquivar')
      } else {
        if (onArchived) onArchived()
        else router.refresh()
      }
    } catch {
      alert('Erro de rede')
    }
    setLoading(null)
    setOpen(false)
  }

  function handleEdit() {
    setOpen(false)
    if (editUrl) router.push(editUrl)
  }

  return (
    <div className="relative" onContextMenu={handleContextMenu}>
      {children}

      {open && (
        <div
          ref={menuRef}
          className="absolute z-50 min-w-[160px] bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl py-1 text-sm"
          style={{ left: pos.x, top: pos.y }}
        >
          {editUrl && (
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-left"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          )}

          <button
            onClick={handleArchive}
            disabled={loading === 'archive'}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-left disabled:opacity-50"
          >
            {loading === 'archive' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            {isArchived ? 'Desarquivar' : 'Arquivar'}
          </button>

          <div className="border-t border-white/[0.06] my-1" />

          <button
            onClick={handleDelete}
            disabled={loading === 'delete'}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50"
          >
            {loading === 'delete' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Apagar
          </button>
        </div>
      )}
    </div>
  )
}
