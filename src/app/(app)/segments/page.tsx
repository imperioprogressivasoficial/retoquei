import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Filter } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const metadata = { title: 'Segmentos' }

export default async function SegmentsPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const segmentsRaw = await prisma.segment.findMany({
    where: { salonId: salon.id },
    include: { _count: { select: { clients: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // For DYNAMIC segments with {all: true}, count all active clients in salon
  const totalActiveClients = await prisma.client.count({
    where: { salonId: salon.id, deletedAt: null },
  })

  const segments = segmentsRaw.map((s) => {
    const rules = s.rulesJson as any
    const isAllClients = s.type === 'DYNAMIC' && rules?.all === true
    return {
      ...s,
      _count: {
        clients: isAllClients ? totalActiveClients : s._count.clients,
      },
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Segmentos</h1>
          <p className="text-gray-400 mt-1">{segments.length} segmentos criados</p>
        </div>
        <Link
          href="/segments/new"
          className="flex items-center gap-2 bg-[#C9A14A] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo segmento
        </Link>
      </div>

      {segments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <Filter className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-gray-400 mb-2">Nenhum segmento criado ainda</p>
          <p className="text-xs text-gray-600 mb-4">Segmentos agrupam clientes por características em comum</p>
          <Link
            href="/segments/new"
            className="bg-[#C9A14A] text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
          >
            Criar primeiro segmento
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {segments.map((s) => (
            <div key={s.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-[#C9A14A]/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{s.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${s.type === 'DYNAMIC' ? 'bg-blue-400/15 text-blue-400' : 'bg-gray-400/15 text-gray-400'}`}>
                  {s.type === 'DYNAMIC' ? 'Dinâmico' : 'Manual'}
                </span>
              </div>
              {s.description && (
                <p className="text-sm text-gray-400 mb-3">{s.description}</p>
              )}
              <p className="text-sm text-[#C9A14A] font-medium">{s._count.clients} clientes</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
