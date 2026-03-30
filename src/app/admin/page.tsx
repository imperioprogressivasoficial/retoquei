import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'

export default async function AdminOverviewPage() {
  const [tenantCount, customerCount, messageCount, webhookErrors] = await Promise.all([
    prisma.tenant.count(),
    prisma.customer.count(),
    prisma.outboundMessage.count(),
    prisma.webhookEvent.count({ where: { error: { not: null } } }),
  ])

  const stats = [
    { label: 'Tenants', value: tenantCount, color: 'text-gold' },
    { label: 'Clientes (total)', value: customerCount, color: 'text-white' },
    { label: 'Mensagens enviadas', value: messageCount, color: 'text-white' },
    { label: 'Erros de webhook', value: webhookErrors, color: webhookErrors > 0 ? 'text-red-400' : 'text-green-400' },
  ]

  return (
    <div>
      <TopBar title="Admin Overview" />
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-[#1E1E1E] p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
