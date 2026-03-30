import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ---------------------------------------------------------------------------
// KPI Card — metric display for the dashboard
// ---------------------------------------------------------------------------

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number       // percentage change, positive = up, negative = down
  trendLabel?: string
  variant?: 'default' | 'gold' | 'danger' | 'success' | 'warning'
  loading?: boolean
  icon?: React.ReactNode
}

const variantStyles = {
  default: 'border-border',
  gold:    'border-gold/30 bg-gold/5',
  danger:  'border-destructive/30 bg-destructive/5',
  success: 'border-green-500/30 bg-green-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
}

const valueStyles = {
  default: 'text-white',
  gold:    'text-gold',
  danger:  'text-red-400',
  success: 'text-green-400',
  warning: 'text-amber-400',
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  variant = 'default',
  loading,
  icon,
}: KPICardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-[#1E1E1E] p-5 animate-pulse">
        <div className="h-3 w-24 rounded bg-white/10 mb-4" />
        <div className="h-8 w-20 rounded bg-white/10 mb-2" />
        <div className="h-2 w-32 rounded bg-white/10" />
      </div>
    )
  }

  const trendUp = trend !== undefined && trend > 0
  const trendDown = trend !== undefined && trend < 0
  const TrendIcon = trendUp ? TrendingUp : trendDown ? TrendingDown : Minus

  return (
    <div className={cn('rounded-xl border bg-[#1E1E1E] p-5 transition-all hover:border-gold/20', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <p className={cn('mt-3 text-3xl font-bold tracking-tight', valueStyles[variant])}>
        {value}
      </p>

      {(subtitle || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-2">
          {trend !== undefined && (
            <span className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trendUp ? 'text-green-400' : trendDown ? 'text-red-400' : 'text-muted-foreground',
            )}>
              <TrendIcon className="h-3 w-3" />
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trendLabel && <p className="text-xs text-muted-foreground">{trendLabel}</p>}
        </div>
      )}
    </div>
  )
}
