import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { Users, RefreshCw, Tag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Segments Page
// ---------------------------------------------------------------------------

export default async function SegmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let tenantId: string | null = null
  let segments: any[] = []
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, include: { ownedTenants: { take: 1 } } })
    tenantId = dbUser?.ownedTenants[0]?.tenantId ?? null

    if (tenantId) {
      segments = await prisma.segment.findMany({
        where: { tenantId, isActive: true },
        orderBy: [{ isSystem: 'desc' }, { customerCount: 'desc' }],
      })
    }
  } catch { }

  const systemSegments = segments.filter((s) => s.isSystem)
  const customSegments = segments.filter((s) => !s.isSystem)

  return (
    <div>
      <TopBar title="Segmentos" subtitle={`${segments.length} segmentos ativos`} />
      <div className="p-6 space-y-6">

        {/* System segments */}
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Segmentos do Sistema</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {systemSegments.map((seg) => (
              <div key={seg.id} className="rounded-xl border border-border bg-[#1E1E1E] p-4 hover:border-gold/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-white">{seg.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground bg-white/5 rounded px-1.5 py-0.5">Sistema</span>
                </div>
                {seg.description && (
                  <p className="mt-1.5 text-xs text-muted-foreground">{seg.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gold">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-sm font-semibold">{seg.customerCount}</span>
                    <span className="text-xs text-muted-foreground">clientes</span>
                  </div>
                  {seg.lastComputedAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(seg.lastComputedAt, { addSuffix: true, locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom segments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Segmentos Personalizados</h2>
            <button className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors">
              + Novo Segmento
            </button>
          </div>

          {customSegments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Tag className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-white font-medium">Nenhum segmento personalizado</p>
              <p className="text-xs text-muted-foreground mt-1">Crie segmentos com regras customizadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customSegments.map((seg) => (
                <div key={seg.id} className="rounded-xl border border-border bg-[#1E1E1E] p-4 hover:border-gold/20 transition-colors">
                  <h3 className="text-sm font-medium text-white">{seg.name}</h3>
                  <div className="mt-3 flex items-center gap-1.5 text-gold">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-sm font-semibold">{seg.customerCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
