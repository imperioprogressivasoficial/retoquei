'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Archive, Loader2 } from 'lucide-react'

interface Automation {
  id: string
  name: string
  triggerType: string
  isActive: boolean
  archivedAt: string | null
  templateName: string | null
}

const TRIGGER_LABELS: Record<string, string> = {
  AT_RISK: 'Cliente em risco',
  BIRTHDAY: 'Aniversário',
  POST_VISIT: 'Pós-visita',
  WINBACK: 'Recuperação',
  MANUAL_RULE: 'Regra manual',
}

export default function AutomationsList({ automations }: { automations: Automation[] }) {
  const router = useRouter()
  const [menu, setMenu] = useState<{ x: number; y: number; item: Automation } | null>(null)
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

  function onContext(e: React.MouseEvent, item: Automation) {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, item })
  }

  async function handleDelete() {
    if (!menu) return
    if (!window.confirm('Tem certeza que deseja apagar esta automação?')) return
    setLoading('delete')
    await fetch(`/api/automations/${menu.item.id}`, { method: 'DELETE' })
    setMenu(null); setLoading(null); router.refresh()
  }

  async function handleArchive() {
    if (!menu) return
    setLoading('archive')
    const action = menu.item.archivedAt ? 'unarchive' : 'archive'
    await fetch(`/api/automations/${menu.item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setMenu(null); setLoading(null); router.refresh()
  }

  return (
    <>
      <div className="space-y-3">
        {automations.map((a) => (
          <div
            key={a.id}
            onContextMenu={(e) => onContext(e, a)}
            className={`flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-[#C9A14A]/20 transition-colors cursor-pointer ${a.archivedAt ? 'opacity-50' : ''}`}
          >
            <div>
              <h3 className="font-semibold text-white">
                {a.name}
                {a.archivedAt && <span className="ml-2 text-xs text-gray-500 font-normal">(arquivada)</span>}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">Gatilho: {TRIGGER_LABELS[a.triggerType] ?? a.triggerType}</span>
                {a.templateName && <span className="text-xs text-gray-500">Template: {a.templateName}</span>}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.isActive ? 'bg-emerald-400/15 text-emerald-400' : 'bg-gray-400/15 text-gray-400'}`}>
              {a.isActive ? 'Ativa' : 'Inativa'}
            </span>
          </div>
        ))}
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[170px] bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl py-1 text-sm"
          style={{ left: menu.x, top: menu.y }}
        >
          <button
            onClick={() => { setMenu(null) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-left"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
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
