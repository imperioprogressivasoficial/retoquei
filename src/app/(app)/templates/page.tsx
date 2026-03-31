import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { FileText, Plus } from 'lucide-react'

// ---------------------------------------------------------------------------
// Templates Page
// ---------------------------------------------------------------------------

const VARIABLE_BADGE_COLORS: Record<string, string> = {
  '{{customer_name}}': 'text-blue-400 bg-blue-400/10',
  '{{first_name}}': 'text-blue-400 bg-blue-400/10',
  '{{salon_name}}': 'text-green-400 bg-green-400/10',
  '{{days_since_last_visit}}': 'text-amber-400 bg-amber-400/10',
  '{{preferred_service}}': 'text-purple-400 bg-purple-400/10',
}

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) redirect('/onboarding/1')

  const templates = await prisma.messageTemplate.findMany({
    where: { OR: [{ tenantId }, { isSystem: true }] },
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <TopBar title="Templates" subtitle="Mensagens personalizadas" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <button className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Novo Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-white">Nenhum template ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {templates.map((tpl) => {
              const vars = (tpl.body.match(/\{\{[^}]+\}\}/g) ?? [])
              return (
                <div key={tpl.id} className="rounded-xl border border-border bg-[#1E1E1E] p-5 hover:border-gold/20 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <h3 className="text-sm font-semibold text-white">{tpl.name}</h3>
                    </div>
                    {tpl.isSystem && (
                      <span className="text-xs bg-white/5 text-muted-foreground rounded px-1.5 py-0.5">Sistema</span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-3 font-mono bg-black/20 rounded p-2">
                    {tpl.body}
                  </p>

                  {vars.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {vars.map((v) => (
                        <span key={v} className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${VARIABLE_BADGE_COLORS[v] ?? 'text-muted-foreground bg-white/5'}`}>
                          {v}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button className="text-xs text-muted-foreground hover:text-white transition-colors">Editar</button>
                    <span className="text-muted-foreground">·</span>
                    <button className="text-xs text-gold hover:underline">Testar envio</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
