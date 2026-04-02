'use client'

import { AlertTriangle, TrendingDown, Calendar } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Customer Risk Assessment Panel
// ---------------------------------------------------------------------------

interface RiskAssessmentProps {
  customer: {
    riskLevel: string
    lifecycleStage: string
    metrics?: {
      lastVisitAt?: string
      daysSinceLastVisit?: number
      avgDaysBetweenVisits?: number
      predictedReturnDate?: string
      repeatVisitRate?: number
    }
  }
}

interface RiskFactor {
  label: string
  severity: 'high' | 'medium' | 'low' | 'none'
  description: string
}

export function RiskAssessment({ customer }: RiskAssessmentProps) {
  const riskFactors: RiskFactor[] = []

  // Analyze risk factors
  if (customer.metrics) {
    const daysSinceLastVisit = customer.metrics.daysSinceLastVisit ?? 0
    const avgDaysBetweenVisits = customer.metrics.avgDaysBetweenVisits ?? 0

    // Factor 1: Days since last visit
    if (daysSinceLastVisit > avgDaysBetweenVisits * 1.5) {
      riskFactors.push({
        label: 'Inatividade Anormal',
        severity: 'high',
        description: `Sem visita há ${daysSinceLastVisit} dias (histórico: ${Math.round(avgDaysBetweenVisits)} dias)`,
      })
    } else if (daysSinceLastVisit > avgDaysBetweenVisits) {
      riskFactors.push({
        label: 'Inatividade Moderada',
        severity: 'medium',
        description: `Sem visita há ${daysSinceLastVisit} dias`,
      })
    }

    // Factor 2: Low repeat visit rate
    const repeatRate = customer.metrics.repeatVisitRate ?? 0
    if (repeatRate < 30) {
      riskFactors.push({
        label: 'Taxa de Retorno Baixa',
        severity: 'high',
        description: `Apenas ${Math.round(repeatRate)}% de probabilidade de retorno`,
      })
    } else if (repeatRate < 60) {
      riskFactors.push({
        label: 'Taxa de Retorno Moderada',
        severity: 'medium',
        description: `${Math.round(repeatRate)}% de probabilidade de retorno`,
      })
    }
  }

  // Factor 3: Lifecycle stage
  if (customer.lifecycleStage === 'AT_RISK') {
    riskFactors.push({
      label: 'Classificação em Risco',
      severity: 'high',
      description: 'Cliente marcado como em risco',
    })
  } else if (customer.lifecycleStage === 'DORMANT') {
    riskFactors.push({
      label: 'Cliente Inativo',
      severity: 'high',
      description: 'Sem atividade registrada recentemente',
    })
  }

  // Overall risk level from field
  const riskLevelColor = {
    LOW: 'text-green-400',
    MEDIUM: 'text-amber-400',
    HIGH: 'text-red-400',
  }[customer.riskLevel as keyof typeof riskLevelColor] || 'text-muted-foreground'

  const riskLevelBg = {
    LOW: 'bg-green-500/10 border-green-500/20',
    MEDIUM: 'bg-amber-500/10 border-amber-500/20',
    HIGH: 'bg-red-500/10 border-red-500/20',
  }[customer.riskLevel as keyof typeof riskLevelBg] || 'bg-white/5 border-border'

  const riskLevelLabel = {
    LOW: 'Baixo',
    MEDIUM: 'Médio',
    HIGH: 'Alto',
  }[customer.riskLevel as keyof typeof riskLevelLabel] || customer.riskLevel

  return (
    <div className="space-y-4">
      {/* Overall Risk Level */}
      <div className={`rounded-lg border p-4 ${riskLevelBg}`}>
        <p className="text-xs text-muted-foreground mb-1">Nível de Risco Geral</p>
        <p className={`text-2xl font-bold ${riskLevelColor}`}>
          {riskLevelLabel}
        </p>
      </div>

      {/* Risk Factors */}
      {riskFactors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Fatores de Risco</p>
          {riskFactors.map((factor, idx) => {
            const severityColor = {
              high: 'bg-red-500/10 border-red-500/20 text-red-400',
              medium: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
              low: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
              none: 'bg-green-500/10 border-green-500/20 text-green-400',
            }[factor.severity]

            const severityIcon = {
              high: '🔴',
              medium: '🟡',
              low: '🟢',
              none: '✓',
            }[factor.severity]

            return (
              <div key={idx} className={`rounded-lg border p-3 ${severityColor}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">{severityIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{factor.label}</p>
                    <p className="text-xs opacity-80 mt-0.5">{factor.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">✓</span>
            <div>
              <p className="text-sm font-medium text-green-400">Cliente Saudável</p>
              <p className="text-xs text-green-300 opacity-80 mt-0.5">
                Nenhum fator de risco detectado
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Predicted Return */}
      {customer.metrics?.predictedReturnDate && (
        <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Retorno Previsto</p>
              <p className="text-sm font-semibold text-gold mt-0.5">
                {format(new Date(customer.metrics.predictedReturnDate), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(customer.metrics.predictedReturnDate), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="rounded-lg border border-border bg-white/5 p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Recomendações</p>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          {customer.riskLevel === 'HIGH' && (
            <>
              <li>• Contato urgente com campanha de retenção</li>
              <li>• Oferecer promocional ou benefício especial</li>
              <li>• Agendar follow-up em até 7 dias</li>
            </>
          )}
          {customer.riskLevel === 'MEDIUM' && (
            <>
              <li>• Enviar mensagem de check-in personalizada</li>
              <li>• Destacar novo serviço/produto relevante</li>
              <li>• Agendar follow-up em até 14 dias</li>
            </>
          )}
          {customer.riskLevel === 'LOW' && (
            <>
              <li>• Manter comunicação regular</li>
              <li>• Solicitar feedback sobre experiências passadas</li>
              <li>• Identificar oportunidades de upsell/cross-sell</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}
