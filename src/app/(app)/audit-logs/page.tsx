import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Shield } from 'lucide-react'

export default async function AuditLogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { tenantUsers: { take: 1 } },
  })
  const tenantId = dbUser?.tenantUsers[0]?.tenantId
  if (!tenantId) redirect('/onboarding/1')

  const logs = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: true },
  })

  return (
    <div>
      <TopBar title="Logs de Auditoria" />
      <div className="p-6 space-y-4">
        {logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Shield className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-white">Nenhum evento registrado</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-[#161616]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ação</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Recurso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 bg-[#1E1E1E]">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(log.createdAt, 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-xs text-white">{log.user?.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gold bg-gold/10 rounded px-1.5 py-0.5">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.resourceType ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{log.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
