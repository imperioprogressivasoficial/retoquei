import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import AutomationsList from './AutomationsList'

export const metadata = { title: 'Automações' }

export default async function AutomationsPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const automations = await prisma.automation.findMany({
    where: { salonId: salon.id },
    include: { template: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const data = automations.map((a) => ({
    id: a.id,
    name: a.name,
    triggerType: a.triggerType,
    isActive: a.isActive,
    archivedAt: a.archivedAt?.toISOString() ?? null,
    templateName: a.template?.name ?? null,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Automações</h1>
          <p className="text-gray-400 mt-1">{automations.length} automações configuradas</p>
        </div>
        <Link
          href="/automations/new"
          className="bg-[#C9A14A] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors flex items-center gap-2"
        >
          <Zap className="h-4 w-4" /> Nova automação
        </Link>
      </div>

      {automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <Zap className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-400 mb-2">Nenhuma automação configurada ainda</p>
          <p className="text-xs text-gray-400 max-w-xs text-center">
            Automações disparam mensagens automaticamente com base em gatilhos como aniversário, pós-visita ou risco de perda.
          </p>
        </div>
      ) : (
        <AutomationsList automations={data} />
      )}

    </div>
  )
}
