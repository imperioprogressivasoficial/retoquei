'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, Archive, Loader2, MoreVertical } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Segment {
  id: string
  name: string
  description: string | null
  type: string
  archivedAt: string | null
  clientCount: number
}

export default function SegmentsList({ segments }: { segments: Segment[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [menu, setMenu] = useState<{ x: number; y: number; item: Segment } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [menu])

  function onContext(e: React.MouseEvent, item: Segment) {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, item })
  }

  async function handleDelete() {
    if (!menu) return
    const ok = await confirm({ title: 'Apagar segmento?', description: 'Esta ação não pode ser desfeita.', confirmLabel: 'Apagar', variant: 'danger' })
    if (!ok) return
    setLoading('delete')
    await fetch(`/api/segments/${menu.item.id}`, { method: 'DELETE' })
    setMenu(null); setLoading(null); router.refresh()
  }

  async function handleArchive() {
    if (!menu) return
    setLoading('archive')
    const action = menu.item.archivedAt ? 'unarchive' : 'archive'
    await fetch(`/api/segments/${menu.item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setMenu(null); setLoading(null); router.refresh()
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        {segments.map((s) => (
          <div
            key={s.id}
            onContextMenu={(e) => onContext(e, s)}
            className={`relative bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-[#C9A14A]/30 transition-colors cursor-pointer ${s.archivedAt ? 'opacity-50' : ''}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                setMenu({ x: rect.right - 170, y: rect.bottom + 4, item: s })
              }}
              className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">
                {s.name}
                {s.archivedAt && <span className="ml-2 text-xs text-gray-500 font-normal">(arquivado)</span>}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${s.type === 'DYNAMIC' ? 'bg-blue-400/15 text-blue-400' : 'bg-gray-400/15 text-gray-400'}`}>
                {s.type === 'DYNAMIC' ? 'Dinâmico' : 'Manual'}
              </span>
            </div>
            {s.description && <p className="text-sm text-gray-400 mb-3">{s.description}</p>}
            <p className="text-sm text-[#C9A14A] font-medium">{s.clientCount} clientes</p>
          </div>
        ))}
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[170px] bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl py-1 text-sm"
          style={{ left: menu.x, top: menu.y }}
        >
          <Link
            href={`/segments/${menu.item.id}`}
            onClick={() => setMenu(null)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Link>
          <button
            onClick={handleArchive}
            disabled={loading === 'archive'}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-left disabled:opacity-50"
          >
            {loading === 'archive' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
            {menu.item.archivedAt ? 'Desarquivar' : 'Arquivar'}
          </button>
          <div className="border-t border-white/[0.06] my-1" />
          <button
            onClick={handleDelete}
            disabled={loading === 'delete'}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50"
          >
            {loading === 'delete' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Apagar
          </button>
        </div>
      )}
    </>
  )
}
