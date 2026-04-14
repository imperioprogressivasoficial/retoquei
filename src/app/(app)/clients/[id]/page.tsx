import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { MESSAGE_STATUS_LABELS } from '@/lib/constants'

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Novo', color: 'bg-blue-400/15 text-blue-400' },
  RECURRING: { label: 'Recorrente', color: 'bg-emerald-400/15 text-emerald-400' },
  VIP: { label: 'VIP', color: 'bg-[#C9A14A]/15 text-[#C9A14A]' },
  AT_RISK: { label: 'Em risco', color: 'bg-orange-400/15 text-orange-400' },
  LOST: { label: 'Perdido', color: 'bg-red-400/15 text-red-400' },
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const client = await prisma.client.findFirst({
    where: { id, salonId: salon.id, deletedAt: null },
    include: {
      appointments: {
        orderBy: { appointmentDate: 'desc' },
        take: 10,
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!client) notFound()

  const stage = STAGE_LABELS[client.lifecycleStage] ?? { label: client.lifecycleStage, color: 'bg-gray-400/15 text-gray-400' }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/clients" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.fullName}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${stage.color}`}>{stage.label}</span>
          </div>
        </div>
        <Link
          href={`/clients/${client.id}/edit`}
          className="flex items-center gap-2 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Pencil className="h-4 w-4" /> Editar
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Informações</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Telefone</dt>
              <dd className="text-white">{client.phone}</dd>
            </div>
            {client.email && (
              <div className="flex justify-between">
                <dt className="text-gray-500">E-mail</dt>
                <dd className="text-white">{client.email}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Visitas</dt>
              <dd className="text-white">{client.visitCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Total gasto</dt>
              <dd className="text-white">R$ {Number(client.totalSpent).toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Ticket médio</dt>
              <dd className="text-white">R$ {Number(client.averageTicket).toFixed(2)}</dd>
            </div>
            {client.lastVisitAt && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Última visita</dt>
                <dd className="text-white">{new Date(client.lastVisitAt).toLocaleDateString('pt-BR')}</dd>
              </div>
            )}
          </dl>
        </div>

        {client.notes && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Observações</h2>
            <p className="text-sm text-gray-400">{client.notes}</p>
          </div>
        )}
      </div>

      {client.appointments.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Últimos agendamentos</h2>
          <div className="space-y-2">
            {client.appointments.map((a) => (
              <div key={a.id} className="flex justify-between items-center text-sm py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-white">{a.serviceName}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{new Date(a.appointmentDate).toLocaleDateString('pt-BR')}</span>
                  <span className="text-gray-400">R$ {Number(a.amount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {client.messages.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Últimas mensagens</h2>
          <div className="space-y-2">
            {client.messages.map((m) => (
              <div key={m.id} className="text-sm py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${m.status === 'DELIVERED' || m.status === 'READ' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>
                    {MESSAGE_STATUS_LABELS[m.status] ?? m.status}
                  </span>
                  <span className="text-gray-400 text-xs">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-gray-300 truncate">{m.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
