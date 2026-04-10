import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Megaphone } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const metadata = { title: 'Campanhas' }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-400/15 text-gray-400' },
  SCHEDULED: { label: 'Agendada', color: 'bg-blue-400/15 text-blue-400' },
  RUNNING: { label: 'Em andamento', color: 'bg-[#C9A14A]/15 text-[#C9A14A]' },
  COMPLETED: { label: 'Concluída', color: 'bg-emerald-400/15 text-emerald-400' },
  FAILED: { label: 'Falhou', color: 'bg-red-400/15 text-red-400' },
}

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
          <Megaphone className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-gray-400 mb-2">Nenhuma campanha criada ainda</p>
          <p className="text-xs text-gray-600 mb-4">Campanhas enviam mensagens para segmentos de clientes</p>
          <Link
            href="/campaigns/new"
            className="bg-[#C9A14A] text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
          >
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Segmento</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Destinatários</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Criada em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {campaigns.map((c) => {
                const status = STATUS_LABELS[c.status] ?? { label: c.status, color: 'bg-gray-400/15 text-gray-400' }
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      <Link href={`/campaigns/${c.id}`} className="hover:text-[#C9A14A] transition-colors">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{c.segment?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{c._count.recipients}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
