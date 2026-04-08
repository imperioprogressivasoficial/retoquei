export type LifecycleStage = 'NEW' | 'RECURRING' | 'VIP' | 'AT_RISK' | 'LOST'

export function calculateLifecycleStage(client: {
  visitCount: number
  lastVisitAt: Date | null
  averageIntervalDays: number
  totalSpent: number | { toNumber(): number }
}): LifecycleStage {
  if (!client.lastVisitAt || client.visitCount === 0) return 'NEW'

  const daysSinceLastVisit = Math.floor(
    (Date.now() - client.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24),
  )

  const expectedInterval = client.averageIntervalDays || 30
  const totalSpent =
    typeof client.totalSpent === 'number'
      ? client.totalSpent
      : client.totalSpent.toNumber()

  if (client.visitCount === 1 && daysSinceLastVisit <= 30) return 'NEW'
  if (daysSinceLastVisit > expectedInterval * 3) return 'LOST'
  if (daysSinceLastVisit > expectedInterval * 1.5) return 'AT_RISK'
  if (client.visitCount >= 5 || totalSpent > 500) return 'VIP'
  return 'RECURRING'
}
