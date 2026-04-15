import { calculateLTV, formatCurrency, TIER_LABELS, type ClientFinancials } from '@/lib/ltv'
import { Crown, TrendingUp, Activity, Calendar, DollarSign } from 'lucide-react'

interface LTVCardProps {
  client: ClientFinancials
}

export default function LTVCard({ client }: LTVCardProps) {
  const breakdown = calculateLTV(client)
  const tier = TIER_LABELS[breakdown.tier]

  const healthColor =
    breakdown.healthScore >= 80 ? 'text-emerald-400'
    : breakdown.healthScore >= 60 ? 'text-lime-400'
    : breakdown.healthScore >= 40 ? 'text-[#C9A14A]'
    : breakdown.healthScore >= 20 ? 'text-orange-400'
    : 'text-red-400'

  const healthBarColor =
    breakdown.healthScore >= 80 ? 'bg-emerald-400'
    : breakdown.healthScore >= 60 ? 'bg-lime-400'
    : breakdown.healthScore >= 40 ? 'bg-[#C9A14A]'
    : breakdown.healthScore >= 20 ? 'bg-orange-400'
    : 'bg-red-400'

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-5">
      {/* Header: tier + LTV */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-4 w-4 text-[#C9A14A]" />
            <h2 className="text-sm font-semibold text-gray-300">Valor do cliente (LTV)</h2>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">{formatCurrency(breakdown.observed)}</span>
            {breakdown.projected > 0 && (
              <span className="text-xs text-gray-500">
                + {formatCurrency(breakdown.projected)} projetado/ano
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${tier.bg} ${tier.color}`}>
          {tier.label}
        </span>
      </div>

      {/* Health score bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Saúde do relacionamento</span>
          <span className={`text-xs font-semibold ${healthColor}`}>
            {breakdown.healthLabel} · {breakdown.healthScore}/100
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full ${healthBarColor} transition-all duration-500`}
            style={{ width: `${breakdown.healthScore}%` }}
          />
        </div>
      </div>

      {/* RFM grid */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <RFMScore
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Recência"
          score={breakdown.recencyScore}
          detail={
            breakdown.recencyDays === null
              ? '—'
              : breakdown.recencyDays === 0
                ? 'Hoje'
                : `${breakdown.recencyDays}d atrás`
          }
        />
        <RFMScore
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Frequência"
          score={breakdown.frequencyScore}
          detail={
            breakdown.frequency < 0.1
              ? '< 1/mês'
              : `${breakdown.frequency.toFixed(1)}/mês`
          }
        />
        <RFMScore
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label="Valor"
          score={breakdown.monetaryScore}
          detail={formatCurrency(Number(client.averageTicket) || 0)}
        />
      </div>

      {/* Breakdown */}
      <div className="pt-3 border-t border-white/[0.05] space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Tempo de relacionamento</span>
          <span className="text-gray-300">{breakdown.lifetimeMonths.toFixed(1)} meses</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total de visitas</span>
          <span className="text-gray-300">{client.visitCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ticket médio</span>
          <span className="text-gray-300">{formatCurrency(Number(client.averageTicket) || 0)}</span>
        </div>
      </div>

      {breakdown.projected > 0 && (
        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-3 flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-300 leading-relaxed">
            Se mantiver o padrão atual, este cliente deve gerar mais{' '}
            <span className="text-emerald-400 font-semibold">{formatCurrency(breakdown.projected)}</span>{' '}
            nos próximos 12 meses.
          </p>
        </div>
      )}
    </div>
  )
}

function RFMScore({
  icon,
  label,
  score,
  detail,
}: {
  icon: React.ReactNode
  label: string
  score: 1 | 2 | 3 | 4 | 5
  detail: string
}) {
  const color =
    score >= 4 ? 'text-emerald-400 border-emerald-400/30'
    : score === 3 ? 'text-[#C9A14A] border-[#C9A14A]/30'
    : 'text-gray-400 border-white/10'

  return (
    <div className={`rounded-lg border ${color.split(' ').slice(1).join(' ')} bg-white/[0.02] p-2.5`}>
      <div className="flex items-center gap-1 text-gray-500 text-[10px] uppercase tracking-wide font-medium mb-1">
        {icon}
        {label}
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-base font-bold ${color.split(' ')[0]}`}>{score}/5</span>
      </div>
      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{detail}</p>
    </div>
  )
}
