import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Plus, Megaphone } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import CampaignsList from './CampaignsList'
import { CampaignsLoading } from './CampaignsLoading'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Campanhas' }

export default async function CampaignsPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const campaigns = await prisma.campaign.findMany({
    where: { salonId: salon.id },
    include: {
      segment: true,
      template: true,
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Serialize for client component
  const data = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    archivedAt: c.archivedAt ? c.archivedAt.toISOString() : null,
    createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    segment: c.segment ? { name: c.segment.name } : null,
    _count: c._count,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Campanhas</h1>
          <p className="text-gray-400 mt-1">{campaigns.length} campanhas criadas</p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 bg-[#C9A14A] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova campanha
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <Megaphone className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-400 mb-2">Nenhuma campanha criada ainda</p>
          <p className="text-xs text-gray-400 mb-4">Campanhas enviam mensagens para segmentos de clientes</p>
          <Link
            href="/campaigns/new"
            className="bg-[#C9A14A] text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
          >
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <Suspense fallback={<CampaignsLoading />}>
          <CampaignsList campaigns={data} />
        </Suspense>
      )}
    </div>
  )
}
