import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { KPICard } from '@/components/dashboard/KPICard'
import { CustomerEvolutionChart } from '@/components/dashboard/CustomerEvolutionChart'
import { SegmentDistributionChart } from '@/components/dashboard/SegmentDistributionChart'
import {
  Users, UserPlus, RefreshCw, Crown, AlertTriangle,
  UserX, TrendingUp, BarChart2, MessageSquare, DollarSign,
} from 'lucide-react'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'

// ---------------------------------------------------------------------------
// Dashboard Page — server component for fast initial load
// ---------------------------------------------------------------------------

const IS_DEV_MODE = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

function getMockDashboardData() {
  const evolutionData = Array.from({ length: 12 }, (_, i) => {
    const monthDate = subMonths(new Date(), 11 - i)
    const base = 300 + i * 18
    return {
      month: format(monthDate, 'yyyy-MM'),
      total: base,
      new: Math.floor(base * 0.12),
      recurring: Math.floor(base * 0.45),
    }
  })
  return {
    tenantName: 'Salão Aurora (Demo)',
    totalCustomers: 512, newCustomers: 38, recurringCustomers: 231, vipCustomers: 47,
    atRiskCustomers: 64, lostCustomers: 29, messagesSent: 1240, messagesDelivered: 1108,
    retentionRate: 74, deliveryRate: 89,
    avgTicket: 145, avgLtv: 2340, avgDays: 28, evolutionData,
    segmentData: [
      { name: 'Novos', value: 38, color: '#3b82f6' },
      { name: 'Ativos', value: 103, color: '#22c55e' },
      { name: 'Recorrentes', value: 231, color: '#10b981' },
      { name: 'VIP', value: 47, color: '#C9A14A' },
      { name: 'Em Risco', value: 64, color: '#f59e0b' },
      { name: 'Perdidos', value: 29, color: '#ef4444' },
    ],
  }
}

export default async function DashboardPage() {
  if (IS_DEV_MODE) {
    const mock = getMockDashboardData()
    const fmt = (n: number) => new Intl.NumberFormat('pt-BR').format(n)
    const fmtCurrency = (n: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)

    return (
      <div className="flex flex-col gap-0">
        <TopBar title="Dashboard" subtitle={mock.tenantName} />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard title="Total de Clientes"  value={fmt(mock.totalCustomers)}   icon={<Users className="h-4 w-4" />} />
            <KPICard title="Novos Clientes"     value={fmt(mock.newCustomers)}     variant="default" icon={<UserPlus className="h-4 w-4" />} />
            <KPICard title="Recorrentes"        value={fmt(mock.recurringCustomers)} variant="success" icon={<RefreshCw className="h-4 w-4" />} />
            <KPICard title="VIP"                value={fmt(mock.vipCustomers)}     variant="gold" icon={<Crown className="h-4 w-4" />} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard title="Em Risco"           value={fmt(mock.atRiskCustomers)}  variant="warning" icon={<AlertTriangle className="h-4 w-4" />} />
            <KPICard title="Perdidos"           value={fmt(mock.lostCustomers)}    variant="danger"  icon={<UserX className="h-4 w-4" />} />
            <KPICard title="Retenção"           value={`${mock.retentionRate}%`}   variant="success" icon={<TrendingUp className="h-4 w-4" />} />
            <KPICard title="Taxa de Entrega"    value={`${mock.deliveryRate}%`}    icon={<MessageSquare className="h-4 w-4" />} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard title="Ticket Médio"       value={fmtCurrency(mock.avgTicket)} icon={<BarChart2 className="h-4 w-4" />} />
            <KPICard title="LTV Médio"          value={fmtCurrency(mock.avgLtv)}   variant="gold" icon={<DollarSign className="h-4 w-4" />} />
            <KPICard title="Intervalo Médio"    value={`${mock.avgDays} dias`}     icon={<RefreshCw className="h-4 w-4" />} />
            <KPICard title="Mensagens Enviadas" value={fmt(mock.messagesSent)}     icon={<MessageSquare className="h-4 w-4" />} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border bg-[#1E1E1E] p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Evolução da Base de Clientes</h2>
              <CustomerEvolutionChart data={mock.evolutionData} />
            </div>
            <div className="rounded-xl border border-border bg-[#1E1E1E] p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Distribuição por Estágio</h2>
              <SegmentDistributionChart data={mock.segmentData} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { include: { tenant: true }, take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenant?.id
  const tenantName = dbUser?.ownedTenants[0]?.tenant?.name ?? 'Seu Salão'
  if (!tenantId) redirect('/onboarding/1')

  // ── KPIs ─────────────────────────────────────────────────────────────────

  const [
    totalCustomers,
    newCustomers,
    recurringCustomers,
    vipCustomers,
    atRiskCustomers,
    lostCustomers,
    messagesSent,
    messagesDelivered,
    recoveredRevenue,
  ] = await Promise.all([
    prisma.customer.count({ where: { tenantId, deletedAt: null } }),
    prisma.customer.count({ where: { tenantId, deletedAt: null, lifecycleStage: 'NEW' } }),
    prisma.customer.count({ where: { tenantId, deletedAt: null, lifecycleStage: 'RECURRING' } }),
    prisma.customer.count({ where: { tenantId, deletedAt: null, lifecycleStage: 'VIP' } }),
    prisma.customer.count({ where: { tenantId, deletedAt: null, lifecycleStage: 'AT_RISK' } }),
    prisma.customer.count({ where: { tenantId, deletedAt: null, lifecycleStage: 'LOST' } }),
    prisma.outboundMessage.count({ where: { tenantId, status: { in: ['SENT', 'DELIVERED', 'READ'] } } }),
    prisma.outboundMessage.count({ where: { tenantId, status: { in: ['DELIVERED', 'READ'] } } }),
    prisma.customerMetrics.aggregate({ where: { tenantId }, _sum: { ltv: true } }),
  ])

  const avgMetrics = await prisma.customerMetrics.aggregate({
    where: { tenantId },
    _avg: { avgTicket: true, avgDaysBetweenVisits: true, ltv: true },
  })

  const retentionRate = totalCustomers > 0
    ? Math.round(((recurringCustomers + vipCustomers) / totalCustomers) * 100)
    : 0

  const deliveryRate = messagesSent > 0
    ? Math.round((messagesDelivered / messagesSent) * 100)
    : 0

  // ── Chart data (last 12 months) ────────────────────────────────────────

  const evolutionData = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const monthDate = subMonths(new Date(), 11 - i)
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)
      const month = format(monthDate, 'yyyy-MM')

      return Promise.all([
        prisma.customer.count({ where: { tenantId, deletedAt: null, createdAt: { lte: end } } }),
        prisma.customer.count({ where: { tenantId, deletedAt: null, createdAt: { gte: start, lte: end } } }),
        prisma.customer.count({
          where: {
            tenantId, deletedAt: null,
            lifecycleStage: { in: ['RECURRING', 'VIP'] },
            createdAt: { lte: end },
          },
        }),
      ]).then(([total, newC, recurring]) => ({ month, total, new: newC, recurring }))
    }),
  )

  // ── Segment distribution for donut ────────────────────────────────────

  const segmentData = [
    { name: 'Novos',      value: newCustomers,        color: '#3b82f6' },
    { name: 'Ativos',     value: totalCustomers - newCustomers - recurringCustomers - vipCustomers - atRiskCustomers - lostCustomers, color: '#22c55e' },
    { name: 'Recorrentes',value: recurringCustomers,  color: '#10b981' },
    { name: 'VIP',        value: vipCustomers,        color: '#C9A14A' },
    { name: 'Em Risco',   value: atRiskCustomers,     color: '#f59e0b' },
    { name: 'Perdidos',   value: lostCustomers,       color: '#ef4444' },
  ].filter((s) => s.value > 0)

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR').format(n)
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-0">
      <TopBar title="Dashboard" subtitle={tenantName} />

      <div className="p-6 space-y-6">
        {/* KPI Grid Row 1 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KPICard title="Total de Clientes"  value={fmt(totalCustomers)}   icon={<Users className="h-4 w-4" />} />
          <KPICard title="Novos Clientes"     value={fmt(newCustomers)}     variant="default" icon={<UserPlus className="h-4 w-4" />} />
          <KPICard title="Recorrentes"        value={fmt(recurringCustomers)} variant="success" icon={<RefreshCw className="h-4 w-4" />} />
          <KPICard title="VIP"                value={fmt(vipCustomers)}     variant="gold" icon={<Crown className="h-4 w-4" />} />
        </div>

        {/* KPI Grid Row 2 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KPICard title="Em Risco"           value={fmt(atRiskCustomers)}  variant="warning" icon={<AlertTriangle className="h-4 w-4" />} />
          <KPICard title="Perdidos"           value={fmt(lostCustomers)}    variant="danger"  icon={<UserX className="h-4 w-4" />} />
          <KPICard title="Retenção"           value={`${retentionRate}%`}   variant="success" icon={<TrendingUp className="h-4 w-4" />} />
          <KPICard title="Taxa de Entrega"    value={`${deliveryRate}%`}    icon={<MessageSquare className="h-4 w-4" />} />
        </div>

        {/* KPI Grid Row 3 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KPICard
            title="Ticket Médio"
            value={fmtCurrency(avgMetrics._avg.avgTicket ?? 0)}
            icon={<BarChart2 className="h-4 w-4" />}
          />
          <KPICard
            title="LTV Médio"
            value={fmtCurrency(avgMetrics._avg.ltv ?? 0)}
            variant="gold"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <KPICard
            title="Intervalo Médio"
            value={`${Math.round(avgMetrics._avg.avgDaysBetweenVisits ?? 0)} dias`}
            icon={<RefreshCw className="h-4 w-4" />}
          />
          <KPICard
            title="Mensagens Enviadas"
            value={fmt(messagesSent)}
            icon={<MessageSquare className="h-4 w-4" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Evolution chart — 2/3 width */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-[#1E1E1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Evolução da Base de Clientes</h2>
            <CustomerEvolutionChart data={evolutionData} />
          </div>

          {/* Segment donut — 1/3 width */}
          <div className="rounded-xl border border-border bg-[#1E1E1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Distribuição por Estágio</h2>
            <SegmentDistributionChart data={segmentData} />
          </div>
        </div>
      </div>
    </div>
  )
}
