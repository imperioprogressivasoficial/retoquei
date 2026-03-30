import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function AdminWebhooksPage() {
  const events = await prisma.webhookEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div>
      <TopBar title="Webhook Events" subtitle={`${events.length} eventos recentes`} />
      <div className="p-6">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#161616]">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fonte</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Erro</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 bg-[#1E1E1E]">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {format(e.createdAt, 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-white">{e.source}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.eventType}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${e.processed ? 'text-green-400' : 'text-amber-400'}`}>
                      {e.processed ? 'Processado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-red-400 max-w-xs truncate">{e.error ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
