'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, Archive, Loader2, MoreVertical, X, Users } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { toast } from 'sonner'

interface Client {
  id: string
  fullName: string
  phone: string
  birthDate: Date | null
  createdAt: Date
  lastVisitAt: Date | null
  visitCount: number
  totalSpent: any
  averageTicket: any
  lifecycleStage: string
  archivedAt: Date | null
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Novo', color: 'bg-blue-400/15 text-blue-400' },
  RECURRING: { label: 'Recorrente', color: 'bg-emerald-400/15 text-emerald-400' },
  VIP: { label: 'VIP', color: 'bg-[#C9A14A]/15 text-[#C9A14A]' },
  AT_RISK: { label: 'Em risco', color: 'bg-orange-400/15 text-orange-400' },
  LOST: { label: 'Perdido', color: 'bg-red-400/15 text-red-400' },
}

export default function ClientsList({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [menu, setMenu] = useState<{ x: number; y: number; item: Client } | null>(null)
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

  function onContext(e: React.MouseEvent, item: Client) {
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
    if (selected.size === clients.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(clients.map((c) => c.id)))
    }
  }

  async function handleDelete() {
    if (!menu) return
    const ok = await confirm({ title: 'Apagar cliente?', description: 'Esta ação não pode ser desfeita.', confirmLabel: 'Apagar', variant: 'danger' })
    if (!ok) return
    setLoading('delete')
    await fetch(`/api/clients/${menu.item.id}`, { method: 'DELETE' })
    setMenu(null); setLoading(null); router.refresh()
  }

  async function handleArchive() {
    if (!menu) return
    setLoading('archive')
    const action = menu.item.archivedAt ? 'unarchive' : 'archive'
    await fetch(`/api/clients/${menu.item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setMenu(null); setLoading(null); router.refresh()
  }

  async function handleBulkDelete() {
    const count = selected.size
    const ok = await confirm({
      title: `Apagar ${count} cliente(s)?`,
      description: 'Esta ação não pode ser desfeita. Todos os clientes selecionados serão removidos.',
      confirmLabel: `Apagar ${count}`,
      variant: 'danger',
    })
    if (!ok) return
    setBulkLoading(true)
    await Promise.all(
      Array.from(selected).map((id) => fetch(`/api/clients/${id}`, { method: 'DELETE' }))
    )
    toast.success(`${count} cliente(s) apagado(s)`)
    setSelected(new Set())
    setBulkLoading(false)
    router.refresh()
  }

  async function handleBulkArchive() {
    const count = selected.size
    setBulkLoading(true)
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/clients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'archive' }),
        })
      )
    )
    toast.success(`${count} cliente(s) arquivado(s)`)
    setSelected(new Set())
    setBulkLoading(false)
    router.refresh()
  }

  async function handleCreateSegment() {
    const count = selected.size
    const segmentName = prompt(`Criar segmento com ${count} cliente(s). Nome do segmento:`)
    if (!segmentName) return

    setBulkLoading(true)
    try {
      const res = await fetch('/api/segments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segmentName,
          customerIds: Array.from(selected),
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || 'Erro ao criar segmento')
        return
      }
      const data = await res.json()
      toast.success(`Segmento "${data.segment.name}" criado com ${data.segment.customerCount} cliente(s)`)
      setSelected(new Set())
      router.push('/segments')
    } catch (error) {
      toast.error('Erro ao criar segmento')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Nenhum cliente encontrado.{' '}
            <Link href="/clients/new" className="text-[#C9A14A] hover:underline">Adicionar o primeiro</Link>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 px-1 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={clients.length > 0 && selected.size === clients.length}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-500 text-[#C9A14A] bg-transparent cursor-pointer accent-[#C9A14A]"
              />
              Selecionar todos
            </label>
            {clients.map((client) => {
              const stage = STAGE_LABELS[client.lifecycleStage] ?? { label: client.lifecycleStage, color: 'bg-gray-400/15 text-gray-400' }
              const isSelected = selected.has(client.id)
              return (
                <div
                  key={client.id}
                  onContextMenu={(e) => onContext(e, client)}
                  className={`bg-white/[0.03] border rounded-xl p-4 transition-colors ${isSelected ? 'border-[#C9A14A]/50 bg-[#C9A14A]/5' : 'border-white/[0.08]'} ${client.archivedAt ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(client.id)}
                        className="w-4 h-4 mt-0.5 rounded border-gray-500 text-[#C9A14A] bg-transparent cursor-pointer accent-[#C9A14A]"
                      />
                      <div className="min-w-0">
                        <Link href={`/clients/${client.id}`} className="text-white hover:text-[#C9A14A] transition-colors font-medium text-sm block truncate">
                          {client.fullName}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{client.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${stage.color}`}>{stage.label}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenu({ x: rect.right - 170, y: rect.bottom + 4, item: client })
                        }}
                        className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-7 text-xs text-gray-500">
                    <span>{client.visitCount} visita{client.visitCount !== 1 ? 's' : ''}</span>
                    {client.lastVisitAt && (
                      <>
                        <span>·</span>
                        <span>última: {new Date(client.lastVisitAt).toLocaleDateString('pt-BR')}</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      <div className="hidden md:block bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={clients.length > 0 && selected.size === clients.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-500 text-[#C9A14A] focus:ring-[#C9A14A]/50 bg-transparent cursor-pointer accent-[#C9A14A]"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Cliente</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Nascimento</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Cadastro</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Último atend.</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Visitas</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Total</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Ticket Médio</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Estágio</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-500 text-sm">
                  Nenhum cliente encontrado.{' '}
                  <Link href="/clients/new" className="text-[#C9A14A] hover:underline">Adicionar o primeiro</Link>
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const stage = STAGE_LABELS[client.lifecycleStage] ?? { label: client.lifecycleStage, color: 'bg-gray-400/15 text-gray-400' }
                const isSelected = selected.has(client.id)
                const birthDate = client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR') : '—'
                const createdAt = client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '—'
                const lastVisit = client.lastVisitAt ? new Date(client.lastVisitAt).toLocaleDateString('pt-BR') : '—'
                const totalSpent = typeof client.totalSpent === 'number' ? `R$ ${client.totalSpent.toFixed(2)}` : '—'
                const avgTicket = typeof client.averageTicket === 'number' ? `R$ ${client.averageTicket.toFixed(2)}` : '—'
                return (
                  <tr
                    key={client.id}
                    onContextMenu={(e) => onContext(e, client)}
                    className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${client.archivedAt ? 'opacity-50' : ''} ${isSelected ? 'bg-[#C9A14A]/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(client.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-500 text-[#C9A14A] focus:ring-[#C9A14A]/50 bg-transparent cursor-pointer accent-[#C9A14A]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/clients/${client.id}`} className="text-white hover:text-[#C9A14A] transition-colors font-medium text-sm whitespace-nowrap">
                        {client.fullName}
                      </Link>
                      {client.archivedAt && <span className="ml-2 text-xs text-gray-500">(arquivado)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{birthDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{createdAt}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{lastVisit}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{client.visitCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{totalSpent}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{avgTicket}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${stage.color} whitespace-nowrap`}>{stage.label}</span>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenu({ x: rect.right - 170, y: rect.bottom + 4, item: client })
                        }}
                        className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-3 shadow-2xl animate-fade-in overflow-x-auto max-w-[90vw]">
          <span className="text-sm text-gray-400 font-medium whitespace-nowrap">{selected.size} selecionado(s)</span>
          <div className="w-px h-5 bg-white/10 shrink-0" />
          <button
            onClick={handleCreateSegment}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#C9A14A] hover:bg-[#C9A14A]/10 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            Criar Segmento
          </button>
          <button
            onClick={handleBulkArchive}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
            Arquivar
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Apagar
          </button>
          <div className="w-px h-5 bg-white/10 shrink-0" />
          <button
            onClick={() => setSelected(new Set())}
            className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
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
            href={`/clients/${menu.item.id}`}
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
