import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Users, Send, Megaphone, AlertTriangle, TrendingUp, UserPlus, UserMinus, Crown, FileText, Plug } from 'lucide-react'

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
    messagesFailed,
    totalCampaigns,
    activeCampaigns,
    recentClients,
    recentCampaigns,
  ] = await Promise.all([
    prisma.client.count({ where: { salonId, deletedAt: null } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'NEW' } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'RECURRING' } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'VIP' } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'AT_RISK' } }),
    prisma.client.count({ where: { salonId, deletedAt: null, lifecycleStage: 'LOST' } }),
    prisma.message.count({ where: { salonId, direction: 'outbound', status: 'SENT' } }),
    prisma.message.count({ where: { salonId, direction: 'outbound', status: 'FAILED' } }),
    prisma.campaign.count({ where: { salonId } }),
    prisma.campaign.count({ where: { salonId, status: { in: ['DRAFT', 'SCHEDULED'] } } }),
    prisma.client.findMany({
      where: { salonId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, fullName: true, phone: true, lifecycleStage: true, createdAt: true },
    }),
    prisma.campaign.findMany({
      where: { salonId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, status: true, createdAt: true, _count: { select: { recipients: true } } },
    }),
  ])

  return {
    totalClients, newClients, recurringClients, vipClients, atRiskClients, lostClients,
    messagesSent, messagesFailed, totalCampaigns, activeCampaigns,
    recentClients, recentCampaigns,
    retentionRate: totalClients > 0
      ? Math.round(((recurringClients + vipClients) / totalClients) * 100)
      : 0,
  }
}

const STAGE_COLORS: Record<string, string> = {
  NEW: 'text-blue-400',
  RECURRING: 'text-emerald-400',
  VIP: 'text-[#C9A14A]',
  AT_RISK: 'text-orange-400',
  LOST: 'text-red-400',
}

const STAGE_LABELS: Record<string, string> = {
  NEW: 'Novo',
  RECURRING: 'Recorrente',
  VIP: 'VIP',
  AT_RISK: 'Em risco',
  LOST: 'Perdido',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'text-gray-400' },
  SCHEDULED: { label: 'Agendada', color: 'text-blue-400' },
  RUNNING: { label: 'Enviando', color: 'text-[#C9A14A]' },
  COMPLETED: { label: 'Concluída', color: 'text-emerald-400' },
  FAILED: { label: 'Falhou', color: 'text-red-400' },
}

export default async function DashboardPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const m = await getMetrics(salon.id)

  const stages = [
    { label: 'Novos', value: m.newClients, color: 'text-blue-400', barColor: 'bg-blue-400', icon: UserPlus },
    { label: 'Recorrentes', value: m.recurringClients, color: 'text-emerald-400', barColor: 'bg-emerald-400', icon: TrendingUp },
    { label: 'VIP', value: m.vipClients, color: 'text-[#C9A14A]', barColor: 'bg-[#C9A14A]', icon: Crown },
    { label: 'Em risco', value: m.atRiskClients, color: 'text-orange-400', barColor: 'bg-orange-400', icon: AlertTriangle },
    { label: 'Perdidos', value: m.lostClients, color: 'text-red-400', barColor: 'bg-red-400', icon: UserMinus },
  ]

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">Visão geral do {salon.name}</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-[#C9A14A]" />
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Total clientes</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{m.totalClients}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-4 w-4 text-emerald-400" />
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Mensagens</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{m.messagesSent}</p>
          {m.messagesFailed > 0 && (
            <p className="text-xs text-red-400 mt-1">{m.messagesFailed} falhas</p>
          )}
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Retenção</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{m.retentionRate}%</p>
          <p className="text-[10px] sm:text-xs text-gray-600 mt-1">recorrentes + VIP</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Em risco</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-orange-400">{m.atRiskClients}</p>
          {m.lostClients > 0 && (
            <p className="text-xs text-red-400 mt-1">{m.lostClients} perdidos</p>
          )}
        </div>
      </div>

      {/* Middle row: lifecycle chart + campaigns summary */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Lifecycle distribution */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Ciclo de vida dos clientes</h2>
          <div className="space-y-3">
            {stages.map((s) => {
              const Icon = s.icon
              const pct = m.totalClients > 0 ? Math.round((s.value / m.totalClients) * 100) : 0
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                  <span className="w-20 sm:w-24 text-sm text-gray-400">{s.label}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.barColor} opacity-70 transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-sm font-semibold w-10 text-right ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-gray-600 w-10 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Campaigns overview */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Campanhas</h2>
            <Link href="/campaigns" className="text-xs text-[#C9A14A] hover:underline">Ver todas</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{m.totalCampaigns}</p>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-[#C9A14A]">{m.activeCampaigns}</p>
              <p className="text-xs text-gray-500 mt-1">Pendentes</p>
            </div>
          </div>
          {m.recentCampaigns.length > 0 ? (
            <div className="space-y-2">
              {m.recentCampaigns.map((c) => {
                const st = STATUS_LABELS[c.status] ?? { label: c.status, color: 'text-gray-400' }
                return (
                  <Link
                    key={c.id}
                    href={`/campaigns/${c.id}`}
                    className="flex items-center justify-between py-2 px-2 -mx-2 rounded hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="text-sm text-white truncate">{c.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">{c._count.recipients}</span>
                      <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Nenhuma campanha</p>
          )}
        </div>
      </div>

      {/* Bottom row: recent clients + quick actions */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent clients */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Clientes recentes</h2>
            <Link href="/clients" className="text-xs text-[#C9A14A] hover:underline">Ver todos</Link>
          </div>
          {m.recentClients.length > 0 ? (
            <div className="space-y-2">
              {m.recentClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="flex items-center justify-between py-2 px-2 -mx-2 rounded hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{c.fullName}</p>
                    <p className="text-xs text-gray-600">{c.phone}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${STAGE_COLORS[c.lifecycleStage] ?? 'text-gray-400'}`}>
                    {STAGE_LABELS[c.lifecycleStage] ?? c.lifecycleStage}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum cliente</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Ações rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/campaigns/new"
              className="flex flex-col items-center gap-2 p-4 bg-[#C9A14A]/10 border border-[#C9A14A]/20 rounded-xl hover:border-[#C9A14A]/40 transition-colors text-center"
            >
              <Megaphone className="h-6 w-6 text-[#C9A14A]" />
              <span className="text-xs font-medium text-[#C9A14A]">Nova campanha</span>
            </Link>
            <Link
              href="/clients/new"
              className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:border-blue-500/40 transition-colors text-center"
            >
              <UserPlus className="h-6 w-6 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Novo cliente</span>
            </Link>
            <Link
              href="/templates/new"
              className="flex flex-col items-center gap-2 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:border-purple-500/40 transition-colors text-center"
            >
              <FileText className="h-6 w-6 text-purple-400" />
              <span className="text-xs font-medium text-purple-400">Novo template</span>
            </Link>
            <Link
              href="/integrations"
              className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:border-emerald-500/40 transition-colors text-center"
            >
              <Plug className="h-6 w-6 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Integrações</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
