import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function AdminConnectorsPage() {
  const connectors = await prisma.bookingConnector.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: { select: { name: true } },
      syncRuns: { orderBy: { startedAt: 'desc' }, take: 1 },
    },
  })

  return (
    <div>
      <TopBar title="Conectores" subtitle={`${connectors.length} configurados`} />
      <div className="p-6">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#161616]">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Conector</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Última Sync</th>
              </tr>
            </thead>
            <tbody>
              {connectors.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 bg-[#1E1E1E]">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.tenant.name}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gold">{c.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${c.status === 'CONNECTED' ? 'text-green-400' : c.status === 'ERROR' ? 'text-red-400' : 'text-amber-400'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.lastSyncAt ? format(c.lastSyncAt, 'dd/MM/yy HH:mm', { locale: ptBR }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
