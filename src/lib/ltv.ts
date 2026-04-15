// ---------------------------------------------------------------------------
// LTV (Lifetime Value) calculator + RFM scoring
// ---------------------------------------------------------------------------

import { differenceInDays } from 'date-fns'

export interface ClientFinancials {
  totalSpent: number
  visitCount: number
  averageTicket: number
  lastVisitAt: Date | null
  createdAt: Date
}

export interface LTVBreakdown {
  /** Observed lifetime value (what they've actually paid) */
  observed: number
  /** Projected lifetime value over next 12 months */
  projected: number
  /** Visits per month (frequency) */
  frequency: number
  /** Days since last visit (recency) */
  recencyDays: number | null
  /** 1–5 score for recency (5 = most recent) */
  recencyScore: 1 | 2 | 3 | 4 | 5
  /** 1–5 score for frequency (5 = most frequent) */
  frequencyScore: 1 | 2 | 3 | 4 | 5
  /** 1–5 score for monetary (5 = highest spender) */
  monetaryScore: 1 | 2 | 3 | 4 | 5
  /** Overall health: 0–100 */
  healthScore: number
  /** Tier based on RFM + LTV */
  tier: 'bronze' | 'prata' | 'ouro' | 'platina'
  /** Human-readable health label */
  healthLabel: 'Excelente' | 'Bom' | 'Regular' | 'Em risco' | 'Perdido'
  /** Months since first visit */
  lifetimeMonths: number
}

function scoreFromThresholds(
  value: number,
  t1: number,
  t2: number,
  t3: number,
  t4: number,
): 1 | 2 | 3 | 4 | 5 {
  if (value >= t4) return 5
  if (value >= t3) return 4
  if (value >= t2) return 3
  if (value >= t1) return 2
  return 1
}

/**
 * Calculate LTV breakdown + RFM scores for a client.
 */
export function calculateLTV(client: ClientFinancials): LTVBreakdown {
  const now = new Date()
  const totalSpent = Number(client.totalSpent) || 0
  const visitCount = Number(client.visitCount) || 0
  const averageTicket = Number(client.averageTicket) || 0

  const lifetimeMs = now.getTime() - new Date(client.createdAt).getTime()
  const lifetimeMonths = Math.max(1, lifetimeMs / (1000 * 60 * 60 * 24 * 30))

  // Frequency = visits per month
  const frequency = visitCount / lifetimeMonths

  // Recency = days since last visit
  const recencyDays = client.lastVisitAt
    ? differenceInDays(now, new Date(client.lastVisitAt))
    : null

  // Recency score: more recent = higher score
  const recencyScore: 1 | 2 | 3 | 4 | 5 =
    recencyDays === null ? 1
    : recencyDays <= 15 ? 5
    : recencyDays <= 30 ? 4
    : recencyDays <= 60 ? 3
    : recencyDays <= 120 ? 2
    : 1

  // Frequency score: higher frequency = higher score
  const frequencyScore = scoreFromThresholds(frequency, 0.25, 0.5, 1.0, 2.0)

  // Monetary score: based on total spent
  const monetaryScore = scoreFromThresholds(totalSpent, 100, 300, 800, 2000)

  // Health: weighted avg (R=40%, F=30%, M=30%) * 20 = 0–100
  const healthScore = Math.round(
    recencyScore * 8 + frequencyScore * 6 + monetaryScore * 6,
  )

  const healthLabel: LTVBreakdown['healthLabel'] =
    healthScore >= 80 ? 'Excelente'
    : healthScore >= 60 ? 'Bom'
    : healthScore >= 40 ? 'Regular'
    : healthScore >= 20 ? 'Em risco'
    : 'Perdido'

  // Tier: combines total spent + health
  const tier: LTVBreakdown['tier'] =
    totalSpent >= 2000 && healthScore >= 60 ? 'platina'
    : totalSpent >= 800 && healthScore >= 40 ? 'ouro'
    : totalSpent >= 300 ? 'prata'
    : 'bronze'

  // Projected LTV: next 12 months at current frequency × avg ticket
  // Discounted by recency health (if at risk, project less)
  const recencyMultiplier = recencyScore >= 4 ? 1.0 : recencyScore === 3 ? 0.6 : 0.3
  const projected = frequency * 12 * averageTicket * recencyMultiplier

  return {
    observed: totalSpent,
    projected: Math.round(projected * 100) / 100,
    frequency: Math.round(frequency * 100) / 100,
    recencyDays,
    recencyScore,
    frequencyScore,
    monetaryScore,
    healthScore,
    tier,
    healthLabel,
    lifetimeMonths: Math.round(lifetimeMonths * 10) / 10,
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const TIER_LABELS: Record<LTVBreakdown['tier'], { label: string; color: string; bg: string }> = {
  bronze: { label: 'Bronze', color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/20' },
  prata: { label: 'Prata', color: 'text-gray-300', bg: 'bg-gray-400/10 border-gray-400/20' },
  ouro: { label: 'Ouro', color: 'text-[#C9A14A]', bg: 'bg-[#C9A14A]/10 border-[#C9A14A]/30' },
  platina: { label: 'Platina', color: 'text-cyan-300', bg: 'bg-cyan-400/10 border-cyan-400/30' },
}
