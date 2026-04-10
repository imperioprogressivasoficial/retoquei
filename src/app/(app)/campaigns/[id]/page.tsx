import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Users, FileText, Send } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import DispatchButton from './DispatchButton'

export const metadata = { title: 'Detalhes da campanha' }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-400/15 text-gray-400' },
  SCHEDULED: { label: 'Agendada', color: 'bg-blue-400/15 text-blue-400' },
  RUNNING: { label: 'Em andamento', color: 'bg-[#C9A14A]/15 text-[#C9A14A]' },
  COMPLETED: { label: 'Concluída', color: 'bg-emerald-400/15 text-emerald-400' },
  FAILED: { label: 'Falhou', color: 'bg-red-400/15 text-red-400' },
}

const MSG_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'text-gray-400' },
  SENT: { label: 'Enviada', color: 'text-blue-400' },
  DELIVERED: { label: 'Entregue', color: 'text-emerald-400' },
  READ: { label: 'Lida', color: 'text-emerald-400' },
  FAILED: { label: 'Falhou', color: 'text-red-400' },
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const campaign = await prisma.campaign.findFirst({
    where: { id, salonId: salon.id },
    include: {
      segment: true,
      template: true,
      recipients: {
        include: {
          client: { select: { id: true, fullName: true, phone: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!campaign) notFound()

  // Count target audience size for preview (DRAFT campaigns have no recipients yet)
  let targetCount = campaign.recipients.length
  if (targetCount === 0 && campaign.segment) {
    const rules = campaign.segment.rulesJson as any
    if (campaign.segment.type === 'DYNAMIC' && rules?.all === true) {
      targetCount = await prisma.client.count({
        where: { salonId: salon.id, deletedAt: null, whatsappOptIn: true },
      })
    } else {
      targetCount = await prisma.clientSegment.count({
        where: { segmentId: campaign.segment.id },
      })
    }
  }

  const status = STATUS_LABELS[campaign.status] ?? { label: campaign.status, color: 'bg-gray-400/15 text-gray-400' }
  const canDispatch = campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED'

  const sentCount = campaign.recipients.filter((r) => r.messageStatus === 'SENT' || r.messageStatus === 'DELIVERED' || r.messageStatus === 'READ').length
  const failedCount = campaign.recipients.filter((r) => r.messageStatus === 'FAILED').length

  return (
    <div>
      <div className="mb-6">
        <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para campanhas
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
            </div>
            <p className="text-sm text-gray-400">
              Criada em {new Date(campaign.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>

          {canDispatch && (
            <DispatchButton campaignId={campaign.id} targetCount={targetCount} />
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <Users className="h-4 w-4" />
            Destinatários
          </div>
          <p className="text-3xl font-bold text-white">{targetCount}</p>
          <p className="text-xs text-gray-500 mt-1">{campaign.segment?.name ?? 'Todos os clientes'}</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <Send className="h-4 w-4" />
            Enviadas
          </div>
          <p className="text-3xl font-bold text-emerald-400">{sentCount}</p>
          {failedCount > 0 && <p className="text-xs text-red-400 mt-1">{failedCount} falhas</p>}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-2">
            <FileText className="h-4 w-4" />
            Template
          </div>
          <p className="text-base font-semibold text-white truncate">{campaign.template?.name ?? '—'}</p>
        </div>
      </div>

      {campaign.template && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Mensagem</h2>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{campaign.template.content}</p>
        </div>
      )}

      {campaign.recipients.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.08]">
            <h2 className="text-sm font-semibold text-gray-300">Destinatários ({campaign.recipients.length})</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Telefone</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Enviada em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {campaign.recipients.map((r) => {
                const st = MSG_STATUS[r.messageStatus] ?? { label: r.messageStatus, color: 'text-gray-400' }
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{r.client.fullName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{r.client.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {r.sentAt ? new Date(r.sentAt).toLocaleString('pt-BR') : '—'}
                    </td>
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
