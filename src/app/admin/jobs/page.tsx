import { TopBar } from '@/components/layout/TopBar'

// ---------------------------------------------------------------------------
// Admin Jobs Page — BullMQ queue health
// TODO: Connect to BullMQ Board or query Redis directly for queue metrics
// ---------------------------------------------------------------------------

const QUEUES = [
  'connector-sync',
  'customer-recompute',
  'segment-refresh',
  'message-send',
  'webhook-process',
  'campaign-schedule',
  'retry-failed-messages',
]

export default function AdminJobsPage() {
  return (
    <div>
      <TopBar title="Filas & Jobs" />
      <div className="p-6 space-y-4">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-400">
            Para visualização em tempo real das filas, acesse o BullMQ Board em{' '}
            <code className="bg-black/20 px-1 rounded">http://localhost:3001/admin/queues</code>{' '}
            (quando o worker estiver em execução com bull-board habilitado).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUEUES.map((q) => (
            <div key={q} className="rounded-xl border border-border bg-[#1E1E1E] p-4">
              <p className="text-sm font-medium text-white font-mono">{q}</p>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>Aguardando: —</span>
                <span>Ativo: —</span>
                <span>Falhas: —</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
