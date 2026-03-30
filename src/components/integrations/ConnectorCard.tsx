'use client'

import { RefreshCw, Settings, CheckCircle, AlertCircle, Clock, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Connector Card — shows connector status, last sync, and actions
// ---------------------------------------------------------------------------

type ConnectorStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR' | 'PENDING'

interface ConnectorCardProps {
  id: string
  name: string
  type: 'CSV' | 'WEBHOOK' | 'TRINKS'
  status: ConnectorStatus
  lastSyncAt?: Date | null
  onSync?: () => void
  onConfigure?: () => void
  syncing?: boolean
}

const typeLabels = { CSV: 'Importação CSV', WEBHOOK: 'Webhook / API', TRINKS: 'Trinks' }
const typeColors = { CSV: 'text-blue-400', WEBHOOK: 'text-purple-400', TRINKS: 'text-green-400' }

const statusConfig: Record<ConnectorStatus, { icon: React.ElementType; label: string; color: string }> = {
  CONNECTED:    { icon: CheckCircle,  label: 'Conectado',      color: 'text-green-400' },
  DISCONNECTED: { icon: XCircle,      label: 'Desconectado',   color: 'text-muted-foreground' },
  SYNCING:      { icon: Loader2,      label: 'Sincronizando',  color: 'text-blue-400' },
  ERROR:        { icon: AlertCircle,  label: 'Erro',           color: 'text-red-400' },
  PENDING:      { icon: Clock,        label: 'Aguardando',     color: 'text-amber-400' },
}

export function ConnectorCard({
  id, name, type, status, lastSyncAt, onSync, onConfigure, syncing,
}: ConnectorCardProps) {
  const { icon: StatusIcon, label, color } = statusConfig[status]

  return (
    <div className="rounded-xl border border-border bg-[#1E1E1E] p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-medium uppercase tracking-wide', typeColors[type])}>
              {typeLabels[type]}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-semibold text-white truncate">{name}</h3>
        </div>

        <div className={cn('flex items-center gap-1.5 text-xs font-medium', color)}>
          <StatusIcon className={cn('h-3.5 w-3.5', status === 'SYNCING' ? 'animate-spin' : '')} />
          {label}
        </div>
      </div>

      {lastSyncAt && (
        <p className="mt-3 text-xs text-muted-foreground">
          Última sincronia:{' '}
          {formatDistanceToNow(lastSyncAt, { addSuffix: true, locale: ptBR })}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing || status === 'SYNCING'}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <RefreshCw className={cn('h-3 w-3', (syncing || status === 'SYNCING') ? 'animate-spin' : '')} />
            Sincronizar
          </button>
        )}
        {onConfigure && (
          <button
            onClick={onConfigure}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
          >
            <Settings className="h-3 w-3" />
            Configurar
          </button>
        )}
      </div>
    </div>
  )
}
