import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Filter } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import SegmentsList from './SegmentsList'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Segmentos' }

export default async function SegmentsPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const segmentsRaw = await prisma.segment.findMany({
    where: { salonId: salon.id },
    include: { _count: { select: { clients: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const totalActiveClients = await prisma.client.count({
    where: { salonId: salon.id, deletedAt: null },
  })

  const data = segmentsRaw.map((s) => {
    const rules = s.rulesJson as any
    const isAllClients = s.type === 'DYNAMIC' && rules?.all === true
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      type: s.type,
      archivedAt: s.archivedAt ? s.archivedAt.toISOString() : null,
      clientCount: isAllClients ? totalActiveClients : s._count.clients,
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Segmentos</h1>
          <p className="text-gray-400 mt-1">{segmentsRaw.length} segmentos criados</p>
        </div>
        <Link
          href="/segments/new"
          className="flex items-center gap-2 bg-[#C9A14A] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo segmento
        </Link>
      </div>

      {segmentsRaw.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <Filter className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-400 mb-2">Nenhum segmento criado ainda</p>
          <p className="text-xs text-gray-400 mb-4">Segmentos agrupam clientes por características em comum</p>
          <Link
            href="/segments/new"
            className="bg-[#C9A14A] text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
          >
            Criar primeiro segmento
          </Link>
        </div>
      ) : (
        <SegmentsList segments={data} />
      )}
    </div>
  )
}
