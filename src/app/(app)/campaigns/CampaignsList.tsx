'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, Archive, Loader2, MoreVertical, X } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { Tooltip } from '@/components/ui/Tooltip'
import { toast } from 'sonner'

interface Campaign {
  id: string
  name: string
  status: string
  archivedAt: string | null
  createdAt: string
  segment: { name: string } | null
  _count: { recipients: number }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-400/15 text-gray-400' },
  SCHEDULED: { label: 'Agendada', color: 'bg-blue-400/15 text-blue-400' },
  RUNNING: { label: 'Em andamento', color: 'bg-[#C9A14A]/15 text-[#C9A14A]' },
  COMPLETED: { label: 'Concluída', color: 'bg-emerald-400/15 text-emerald-400' },
  FAILED: { label: 'Falhou', color: 'bg-red-400/15 text-red-400' },
}

export default function CampaignsList({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [menu, setMenu] = useState<{ x: number; y: number; item: Campaign } | null>(null)
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

  function onContext(e: React.MouseEvent, item: Campaign) {
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
    if (selected.size === campaigns.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(campaigns.map((c) => c.id)))
    }
  }

  async function handleDelete() {
    if (!menu) return
    const ok = await confirm({ title: 'Apagar campanha?', description: 'Esta ação não pode ser desfeita.', confirmLabel: 'Apagar', variant: 'danger' })
    if (!ok) return
    setLoading('delete')
    await fetch(`/api/campaigns/${menu.item.id}`, { method: 'DELETE' })
    setMenu(null); setLoading(null); router.refresh()
  }

  async function handleArchive() {
    if (!menu) return
    setLoading('archive')
    const action = menu.item.archivedAt ? 'unarchive' : 'archive'
    await fetch(`/api/campaigns/${menu.item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setMenu(null); setLoading(null); router.refresh()
  }

  async function handleBulkDelete() {
    const count = selected.size
    const ok = await confirm({
      title: `Apagar ${count} campanha(s)?`,
      description: 'Esta ação não pode ser desfeita. Todas as campanhas selecionadas serão removidas.',
      confirmLabel: `Apagar ${count}`,
      variant: 'danger',
    })
    if (!ok) return
    setBulkLoading(true)
    await Promise.all(
      Array.from(selected).map((id) => fetch(`/api/campaigns/${id}`, { method: 'DELETE' }))
    )
    toast.success(`${count} campanha(s) apagada(s)`)
    setSelected(new Set())
    setBulkLoading(false)
    router.refresh()
  }

  async function handleBulkArchive() {
    const count = selected.size
    setBulkLoading(true)
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/campaigns/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'archive' }),
        })
      )
    )
    toast.success(`${count} campanha(s) arquivada(s)`)
    setSelected(new Set())
    setBulkLoading(false)
    router.refresh()
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">Nenhuma campanha encontrada.</div>
        ) : (
          <>
            <label className="flex items-center gap-2 px-1 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={campaigns.length > 0 && selected.size === campaigns.length}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-500 text-[#C9A14A] bg-transparent cursor-pointer accent-[#C9A14A]"
              />
              Selecionar todas
            </label>
            {campaigns.map((c) => {
              const st = STATUS_LABELS[c.status] ?? { label: c.status, color: 'bg-gray-400/15 text-gray-400' }
              const isSelected = selected.has(c.id)
              return (
                <div
                  key={c.id}
                  onContextMenu={(e) => onContext(e, c)}
                  className={`bg-white/[0.03] border rounded-xl p-4 transition-colors ${isSelected ? 'border-[#C9A14A]/50 bg-[#C9A14A]/5' : 'border-white/[0.08]'} ${c.archivedAt ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(c.id)}
                        className="w-4 h-4 mt-0.5 rounded border-gray-500 text-[#C9A14A] bg-transparent cursor-pointer accent-[#C9A14A]"
                      />
                      <div className="min-w-0">
                        <Link href={`/campaigns/${c.id}`} className="text-white hover:text-[#C9A14A] transition-colors font-medium text-sm block truncate">
                          {c.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{c.segment?.name ?? 'Sem segmento'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenu({ x: rect.right - 170, y: rect.bottom + 4, item: c })
                        }}
                        className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-7 text-xs text-gray-500">
                    <span>{c._count.recipients} destinatário{c._count.recipients !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      <div className="hidden md:block bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={campaigns.length > 0 && selected.size === campaigns.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-500 text-[#C9A14A] focus:ring-[#C9A14A]/50 bg-transparent cursor-pointer accent-[#C9A14A]"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Nome</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Segmento</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Destinatários</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Criada em</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {campaigns.map((c) => {
              const st = STATUS_LABELS[c.status] ?? { label: c.status, color: 'bg-gray-400/15 text-gray-400' }
              const isSelected = selected.has(c.id)
              return (
                <tr
                  key={c.id}
                  onContextMenu={(e) => onContext(e, c)}
                  className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${c.archivedAt ? 'opacity-50' : ''} ${isSelected ? 'bg-[#C9A14A]/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-500 text-[#C9A14A] focus:ring-[#C9A14A]/50 bg-transparent cursor-pointer accent-[#C9A14A]"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    <Link href={`/campaigns/${c.id}`} className="hover:text-[#C9A14A] transition-colors">
                      {c.name}
                    </Link>
                    {c.archivedAt && <span className="ml-2 text-xs text-gray-500">(arquivada)</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{c.segment?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{c._count.recipients}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-2 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        setMenu({ x: rect.right - 170, y: rect.bottom + 4, item: c })
                      }}
                      className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-3 shadow-2xl animate-fade-in">
          <span className="text-sm text-gray-400 font-medium">{selected.size} selecionada(s)</span>
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
            href={`/campaigns/${menu.item.id}`}
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
