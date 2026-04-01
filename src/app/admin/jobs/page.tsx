'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Loader2,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FailedJob {
  id: string
  data: Record<string, unknown>
  error: string
  timestamp: number
  attemptsMade: number
}

interface QueueStats {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  recentFailed: FailedJob[]
  recentCompleted: Array<{ id: string; data: Record<string, unknown>; timestamp: number }>
  error?: string
}

interface JobsResponse {
  queues: QueueStats[]
}

// ---------------------------------------------------------------------------
// Queue display metadata
// ---------------------------------------------------------------------------

const QUEUE_META: Record<string, { label: string; description: string }> = {
  'connector:sync': {
    label: 'Sincronização de Conectores',
    description: 'Sincroniza dados de agendamentos e clientes via conectores externos',
  },
  'customer:recompute': {
    label: 'Recomputação de Clientes',
    description: 'Recalcula métricas de RFM e segmentação para clientes individuais',
  },
  'message:send': {
    label: 'Envio de Mensagens',
    description: 'Processa e envia mensagens WhatsApp para clientes',
  },
  'segment:refresh': {
    label: 'Atualização de Segmentos',
    description: 'Recalcula membros de segmentos com base em regras atuais',
  },
  'webhook:process': {
    label: 'Processamento de Webhooks',
    description: 'Processa payloads de webhooks recebidos de conectores',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number | undefined | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function summariseData(data: Record<string, unknown>): string {
  if (!data || typeof data !== 'object') return '—'
  const entries = Object.entries(data).slice(0, 3)
  return entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(' · ')
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatBadge({
  value,
  label,
  color,
  pulse = false,
}: {
  value: number
  label: string
  color: string
  pulse?: boolean
}) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${color}`}>
      <span className={`text-lg font-bold ${pulse && value > 0 ? 'animate-pulse' : ''}`}>
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
    </div>
  )
}

function QueueCard({
  queue,
  onRetry,
}: {
  queue: QueueStats
  onRetry: (jobId: string, queueName: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [retrying, setRetrying] = useState<string | null>(null)
  const meta = QUEUE_META[queue.name]

  const hasActive = queue.active > 0
  const hasFailed = queue.failed > 0

  const borderColor = queue.error
    ? 'border-yellow-500/30'
    : hasFailed
    ? 'border-red-500/30'
    : hasActive
    ? 'border-green-500/30'
    : 'border-border'

  const headerDot = queue.error
    ? 'bg-yellow-400'
    : hasFailed
    ? 'bg-red-400'
    : hasActive
    ? 'bg-green-400 animate-pulse'
    : 'bg-gray-600'

  async function handleRetry(jobId: string) {
    setRetrying(jobId)
    try {
      await onRetry(jobId, queue.name)
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div className={`rounded-xl border ${borderColor} bg-[#1E1E1E] overflow-hidden transition-colors`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${headerDot}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {meta?.label ?? queue.name}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {meta?.description ?? queue.name}
              </p>
            </div>
          </div>
          {queue.error && <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />}
        </div>

        {queue.error ? (
          <p className="mt-3 text-xs text-yellow-400 bg-yellow-500/10 rounded p-2">
            Erro ao buscar fila: {queue.error}
          </p>
        ) : (
          <div className="mt-4 flex gap-2">
            <StatBadge value={queue.waiting} label="Aguardando" color="bg-blue-500/10 text-blue-400" />
            <StatBadge
              value={queue.active}
              label="Ativo"
              color="bg-green-500/10 text-green-400"
              pulse
            />
            <StatBadge
              value={queue.completed}
              label="Concluído"
              color="bg-white/5 text-muted-foreground"
            />
            <StatBadge
              value={queue.failed}
              label="Falhou"
              color={
                hasFailed ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-muted-foreground'
              }
            />
          </div>
        )}
      </div>

      {/* Failed jobs collapsible section */}
      {!queue.error && queue.recentFailed.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-red-400 font-medium">
                {queue.recentFailed.length} job(s) com falha recente
              </span>
            </span>
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {expanded && (
            <div className="px-5 pb-4 space-y-2">
              {queue.recentFailed.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground mb-1">
                        <span className="text-white/60 font-mono">#{job.id}</span>
                        {' · '}
                        <span>{formatTimestamp(job.timestamp)}</span>
                        {' · '}
                        <span>{job.attemptsMade} tentativa(s)</span>
                      </p>
                      <p className="text-white/80 font-mono text-[11px] truncate">
                        {summariseData(job.data)}
                      </p>
                      <p className="text-red-400 mt-1 line-clamp-2">{job.error}</p>
                    </div>
                    <button
                      onClick={() => handleRetry(job.id)}
                      disabled={retrying === job.id}
                      className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {retrying === job.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                      Retry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 30_000

export default function AdminJobsPage() {
  const [data, setData] = useState<JobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000)
  const [retryFeedback, setRetryFeedback] = useState<{ message: string; ok: boolean } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/jobs', { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      const json: JobsResponse = await res.json()
      setData(json)
      setLastRefreshed(new Date())
      setCountdown(REFRESH_INTERVAL_MS / 1000)
    } catch (e) {
      setFetchError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + auto-refresh every 30 seconds
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL_MS / 1000 : c - 1))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  async function handleRetry(jobId: string, queueName: string) {
    try {
      const res = await fetch('/api/admin/jobs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, queueName }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      setRetryFeedback({ message: `Job #${jobId} enviado para retry com sucesso`, ok: true })
      setTimeout(() => {
        setRetryFeedback(null)
        fetchData()
      }, 2000)
    } catch (e) {
      setRetryFeedback({ message: (e as Error).message, ok: false })
      setTimeout(() => setRetryFeedback(null), 3000)
    }
  }

  const totalActive = data?.queues.reduce((s, q) => s + q.active, 0) ?? 0
  const totalFailed = data?.queues.reduce((s, q) => s + q.failed, 0) ?? 0
  const totalWaiting = data?.queues.reduce((s, q) => s + q.waiting, 0) ?? 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-[#0B0B0B]/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-white">Filas & Jobs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitoramento BullMQ em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Summary badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-400 px-2 py-1">
              <Clock className="h-3 w-3" /> {totalWaiting} aguardando
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                totalActive > 0
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-white/5 text-muted-foreground'
              }`}
            >
              <Activity className="h-3 w-3" /> {totalActive} ativo
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                totalFailed > 0
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-white/5 text-muted-foreground'
              }`}
            >
              <XCircle className="h-3 w-3" /> {totalFailed} falha
            </span>
          </div>

          {/* Connection indicator */}
          {fetchError ? (
            <WifiOff className="h-4 w-4 text-red-400" />
          ) : (
            <Wifi className="h-4 w-4 text-green-400" />
          )}

          {/* Manual refresh button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Last refreshed / countdown */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {lastRefreshed
              ? `Atualizado às ${lastRefreshed.toLocaleTimeString('pt-BR')}`
              : 'Carregando...'}
          </span>
          <span>Próxima atualização em {countdown}s</span>
        </div>

        {/* Retry feedback toast */}
        {retryFeedback && (
          <div
            className={`rounded-lg p-3 text-xs flex items-center gap-2 ${
              retryFeedback.ok
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {retryFeedback.ok ? (
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 shrink-0" />
            )}
            {retryFeedback.message}
          </div>
        )}

        {/* Fetch error banner */}
        {fetchError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            Erro ao carregar filas: {fetchError}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-[#1E1E1E] p-5 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/2 mb-2" />
                <div className="h-3 bg-white/5 rounded w-3/4 mb-4" />
                <div className="flex gap-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-12 w-16 bg-white/5 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Queue cards */}
        {data && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.queues.map((queue) => (
              <QueueCard key={queue.name} queue={queue} onRetry={handleRetry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
