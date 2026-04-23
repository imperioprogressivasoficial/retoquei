'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, Archive, Loader2, MoreVertical, X } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { Tooltip } from '@/components/ui/Tooltip'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  category: string
  content: string
  archivedAt: string | null
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  REACTIVATION: 'Reativação',
  POST_VISIT: 'Pós-visita',
  BIRTHDAY: 'Aniversário',
  UPSELL: 'Upsell',
  CUSTOM: 'Personalizado',
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  REACTIVATION: 'Mensagens para trazer clientes inativos de volta',
  POST_VISIT: 'Mensagens enviadas após uma visita',
  BIRTHDAY: 'Mensagens de parabéns de aniversário',
  UPSELL: 'Mensagens para sugerir novos serviços',
  CUSTOM: 'Template personalizado para seus casos especiais',
}

export default function TemplatesList({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [menu, setMenu] = useState<{ x: number; y: number; item: Template } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
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

  function onContext(e: React.MouseEvent, item: Template) {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, item })
  }

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === templates.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(templates.map((t) => t.id)))
    }
  }

  async function handleDelete() {
    if (!menu) return
    const ok = await confirm({ title: 'Apagar template?', description: 'Esta ação não pode ser desfeita.', confirmLabel: 'Apagar', variant: 'danger' })
    if (!ok) return
    setLoading('delete')
    await fetch(`/api/templates/${menu.item.id}`, { method: 'DELETE' })
    setMenu(null); setLoading(null); router.refresh()
  }

  async function handleArchive() {
    if (!menu) return
    setLoading('archive')
    const action = menu.item.archivedAt ? 'unarchive' : 'archive'
    await fetch(`/api/templates/${menu.item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setMenu(null); setLoading(null); router.refresh()
  }

  async function handleBulkDelete() {
    const count = selected.size
    const ok = await confirm({
      title: `Apagar ${count} template(s)?`,
      description: 'Esta ação não pode ser desfeita. Todos os templates selecionados serão removidos.',
      confirmLabel: `Apagar ${count}`,
      variant: 'danger',
    })
    if (!ok) return
    setBulkLoading(true)
    await Promise.all(
      Array.from(selected).map((id) => fetch(`/api/templates/${id}`, { method: 'DELETE' }))
    )
    toast.success(`${count} template(s) apagado(s)`)
    setSelected(new Set())
    setBulkLoading(false)
    router.refresh()
  }

  async function handleBulkArchive() {
    const count = selected.size
    setBulkLoading(true)
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/templates/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'archive' }),
        })
      )
    )
    toast.success(`${count} template(s) arquivado(s)`)
    setSelected(new Set())
    setBulkLoading(false)
    router.refresh()
  }

  return (
    <>
      {/* Select all header */}
      {templates.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={selected.size === templates.length}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-500 text-[#C9A14A] focus:ring-[#C9A14A]/50 bg-transparent cursor-pointer accent-[#C9A14A]"
          />
          <span className="text-sm text-gray-500">Selecionar todos</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {templates.map((t) => {
          const isSelected = selected.has(t.id)
          return (
            <div
              key={t.id}
              onContextMenu={(e) => onContext(e, t)}
              className={`relative bg-white/[0.03] border rounded-xl p-5 hover:border-[#C9A14A]/30 transition-colors cursor-pointer ${t.archivedAt ? 'opacity-50' : ''} ${isSelected ? 'border-[#C9A14A]/50 bg-[#C9A14A]/5' : 'border-white/[0.08]'}`}
            >
              <div className="absolute top-3 left-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleItem(t.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-500 text-[#C9A14A] focus:ring-[#C9A14A]/50 bg-transparent cursor-pointer accent-[#C9A14A]"
                />
              </div>
              <Tooltip content="Mais ações" side="left">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const rect = e.currentTarget.getBoundingClientRect()
                    setMenu({ x: rect.right - 170, y: rect.bottom + 4, item: t })
                  }}
                  className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </Tooltip>
              <div className="flex items-start justify-between mb-3 pl-6">
                <div>
                  <h3 className="font-semibold text-white">
                    {t.name}
                    {t.archivedAt && <span className="ml-2 text-xs text-gray-500 font-normal">(arquivado)</span>}
                  </h3>
                  <Tooltip content={CATEGORY_DESCRIPTIONS[t.category] ?? t.category} side="top">
                    <span className="text-xs text-gray-500 mt-0.5 cursor-help border-b border-dotted border-gray-500">
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </span>
                  </Tooltip>
                </div>
              </div>
              <p className="text-sm text-gray-400 line-clamp-3">{t.content}</p>
              <p className="text-xs text-gray-400 mt-3">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          )
        })}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-3 shadow-2xl animate-fade-in">
          <span className="text-sm text-gray-400 font-medium">{selected.size} selecionado(s)</span>
          <div className="w-px h-5 bg-white/10" />
          <button
            onClick={handleBulkArchive}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
            Arquivar
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Apagar
          </button>
          <div className="w-px h-5 bg-white/10" />
          <button
            onClick={() => setSelected(new Set())}
            className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[170px] bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl py-1 text-sm"
          style={{ left: menu.x, top: menu.y }}
        >
          <Link
            href={`/templates/${menu.item.id}`}
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
