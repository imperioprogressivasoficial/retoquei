import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Plus, Search } from 'lucide-react'
import ClientsList from './ClientsList'

export const metadata = { title: 'Clientes' }

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
      ...(query && {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phoneNormalized: { contains: query.replace(/\D/g, '') } },
        ],
      }),
      ...(stage && { lifecycleStage: stage as any }),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const data = clients.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
    birthDate: c.birthDate,
    createdAt: c.createdAt,
    lastVisitAt: c.lastVisitAt,
    visitCount: c.visitCount,
    totalSpent: c.totalSpent,
    averageTicket: c.averageTicket,
    lifecycleStage: c.lifecycleStage,
    archivedAt: c.archivedAt,
  }))

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

      <form className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por nome ou telefone..."
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
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

      <ClientsList clients={data} />
    </div>
  )
}
