import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function AdminTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { customers: true, bookingConnectors: true } },
      subscription: true,
    },
  })

  return (
    <div>
      <TopBar title="Tenants" subtitle={`${tenants.length} espaços de trabalho`} />
      <div className="p-6">
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#161616]">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Plano</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clientes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Conectores</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Criado em</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 bg-[#1E1E1E] hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gold">{t.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-white text-sm">{t._count.customers}</td>
                  <td className="px-4 py-3 text-white text-sm">{t._count.bookingConnectors}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {format(t.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${t.status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'}`}>
                      {t.status}
                    </span>
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
