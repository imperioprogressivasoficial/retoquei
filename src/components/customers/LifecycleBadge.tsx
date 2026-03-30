import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Lifecycle Stage Badge
// ---------------------------------------------------------------------------

type LifecycleStage = 'NEW' | 'ACTIVE' | 'RECURRING' | 'VIP' | 'AT_RISK' | 'LOST' | 'DORMANT'

const stageConfig: Record<LifecycleStage, { label: string; className: string }> = {
  NEW:       { label: 'Novo',        className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  ACTIVE:    { label: 'Ativo',       className: 'bg-green-500/15 text-green-400 border-green-500/20' },
  RECURRING: { label: 'Recorrente',  className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  VIP:       { label: 'VIP',         className: 'bg-gold/15 text-gold border-gold/20' },
  AT_RISK:   { label: 'Em Risco',    className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  LOST:      { label: 'Perdido',     className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  DORMANT:   { label: 'Inativo',     className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
}

interface LifecycleBadgeProps {
  stage: LifecycleStage | string
  size?: 'sm' | 'md'
}

export function LifecycleBadge({ stage, size = 'md' }: LifecycleBadgeProps) {
  const config = stageConfig[stage as LifecycleStage] ?? { label: stage, className: 'bg-zinc-500/15 text-zinc-400' }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
      config.className,
    )}>
      {config.label}
    </span>
  )
}
