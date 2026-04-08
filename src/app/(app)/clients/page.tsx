import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Plus, Search } from 'lucide-react'

export const metadata = { title: 'Clientes' }

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Novo', color: 'bg-blue-400/15 text-blue-400' },
  RECURRING: { label: 'Recorrente', color: 'bg-emerald-400/15 text-emerald-400' },
  VIP: { label: 'VIP', color: 'bg-[#C9A14A]/15 text-[#C9A14A]' },
  AT_RISK: { label: 'Em risco', color: 'bg-orange-400/15 text-orange-400' },
  LOST: { label: 'Perdido', color: 'bg-red-400/15 text-red-400' },
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>
}) {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const params = await searchParams
  const query = params.q ?? ''
  const stage = params.stage ?? ''

  const clients = await prisma.client.findMany({
    where: {
      salonId: salon.id,
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { fullName: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query } },
            ],
          }
        : {}),
      ...(stage ? { lifecycleStage: stage as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 mt-1">{clients.length} clientes encontrados</p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 bg-[#C9A14A] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </Link>
      </div>

      {/* Filters */}
      <form className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por nome ou telefone..."
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
          />
        </div>
        <select
          name="stage"
          defaultValue={stage}
          className="bg-white/5 border border-white/10 text-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50"
        >
          <option value="">Todos os estágios</option>
          <option value="NEW">Novo</option>
          <option value="RECURRING">Recorrente</option>
          <option value="VIP">VIP</option>
          <option value="AT_RISK">Em risco</option>
          <option value="LOST">Perdido</option>
        </select>
        <button
          type="submit"
          className="bg-white/10 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-white/15 transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Nome</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Telefone</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Estágio</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Visitas</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Última visita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500 text-sm">
                  Nenhum cliente encontrado.{' '}
                  <Link href="/clients/new" className="text-[#C9A14A] hover:underline">
                    Adicionar o primeiro
                  </Link>
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const stage = STAGE_LABELS[client.lifecycleStage] ?? { label: client.lifecycleStage, color: 'bg-gray-400/15 text-gray-400' }
                return (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${client.id}`} className="text-white hover:text-[#C9A14A] transition-colors font-medium text-sm">
                        {client.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{client.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${stage.color}`}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{client.visitCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {client.lastVisitAt
                        ? new Date(client.lastVisitAt).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
