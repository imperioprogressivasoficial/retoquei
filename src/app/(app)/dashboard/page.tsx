import { redirect } from 'next/navigation'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Dashboard' }

async function getMetrics(salonId: string) {
  const [
    totalClients,
    newClients,
    recurringClients,
    vipClients,
    atRiskClients,
    lostClients,
    messagesSent,
  ] = await Promise.all([
    prisma.client.count({ where: { salonId, deletedAt: null } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'NEW' } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'RECURRING' } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'VIP' } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'AT_RISK' } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'LOST' } }),
    prisma.message.count({ where: { salonId, status: { in: ['SENT', 'DELIVERED', 'READ'] } } }),
  ])

  return { totalClients, newClients, recurringClients, vipClients, atRiskClients, lostClients, messagesSent }
}

export default async function DashboardPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const metrics = await getMetrics(salon.id)

  const stages = [
    { label: 'Novos', value: metrics.newClients, color: 'text-blue-400', barColor: 'bg-blue-400' },
    { label: 'Recorrentes', value: metrics.recurringClients, color: 'text-emerald-400', barColor: 'bg-emerald-400' },
    { label: 'VIP', value: metrics.vipClients, color: 'text-[#C9A14A]', barColor: 'bg-[#C9A14A]' },
    { label: 'Em risco', value: metrics.atRiskClients, color: 'text-orange-400', barColor: 'bg-orange-400' },
    { label: 'Perdidos', value: metrics.lostClients, color: 'text-red-400', barColor: 'bg-red-400' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Visão geral do {salon.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total de clientes</p>
          <p className="text-3xl font-bold text-white">{metrics.totalClients}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mensagens enviadas</p>
          <p className="text-3xl font-bold text-white">{metrics.messagesSent}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Em risco</p>
          <p className="text-3xl font-bold text-orange-400">{metrics.atRiskClients}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Perdidos</p>
          <p className="text-3xl font-bold text-red-400">{metrics.lostClients}</p>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Clientes por ciclo de vida</h2>
        <div className="space-y-3">
          {stages.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <span className="w-24 text-sm text-gray-400">{s.label}</span>
              <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.barColor} opacity-70`}
                  style={{
                    width: metrics.totalClients
                      ? `${Math.round((s.value / metrics.totalClients) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
              <span className={`text-sm font-semibold w-10 text-right ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
