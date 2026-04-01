import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import Link from 'next/link'
import { IntegrationsClient } from './IntegrationsClient'
import { Plus, FileText, Webhook, Lock } from 'lucide-react'

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let connectors: any[] = []
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { ownedTenants: { take: 1 } } })
    const tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null
    if (tenantId) {
      connectors = await prisma.bookingConnector.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      })
    }
  } catch { }

  const connectorsData = connectors.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type as 'CSV' | 'WEBHOOK' | 'TRINKS',
    status: c.status as 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR' | 'PENDING',
    lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
  }))

  return (
    <div>
      <TopBar title="Integrações" subtitle="Conecte sua plataforma de agendamentos" />
      <div className="p-6 space-y-6">

        {/* Active connectors */}
        {connectors.length > 0 && (
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Conectores Ativos</h2>
            <IntegrationsClient connectors={connectorsData} />
          </div>
        )}

        {/* Add connector */}
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Adicionar Conector</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/integrations/csv" className="group rounded-xl border border-border bg-[#1E1E1E] p-5 hover:border-gold/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">Importação CSV</h3>
                  <p className="text-xs text-muted-foreground">Upload de arquivo</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Importe clientes e agendamentos via planilha CSV.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-gold group-hover:underline">
                <Plus className="h-3 w-3" /> Configurar
              </span>
            </Link>

            <div className="rounded-xl border border-border bg-[#1E1E1E] p-5 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Webhook className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Webhook / API</h3>
                  <p className="text-xs text-muted-foreground">Em breve</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Conecte qualquer plataforma via webhook.</p>
            </div>

            <div className="rounded-xl border border-border bg-[#1E1E1E] p-5 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Trinks</h3>
                  <p className="text-xs text-muted-foreground">Em breve</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Integração nativa com o Trinks.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
