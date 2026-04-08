import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Zap } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Automações' }

const TRIGGER_LABELS: Record<string, string> = {
  AT_RISK: 'Cliente em risco',
  BIRTHDAY: 'Aniversário',
  POST_VISIT: 'Pós-visita',
  WINBACK: 'Recuperação',
  MANUAL_RULE: 'Regra manual',
}

export default async function AutomationsPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const automations = await prisma.automation.findMany({
    where: { salonId: salon.id },
    include: { template: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Automações</h1>
          <p className="text-gray-400 mt-1">{automations.length} automações configuradas</p>
        </div>
      </div>

      {automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <Zap className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-gray-400 mb-2">Nenhuma automação configurada ainda</p>
          <p className="text-xs text-gray-600 max-w-xs text-center">
            Automações disparam mensagens automaticamente com base em gatilhos como aniversário, pós-visita ou risco de perda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-[#C9A14A]/20 transition-colors">
              <div>
                <h3 className="font-semibold text-white">{a.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">
                    Gatilho: {TRIGGER_LABELS[a.triggerType] ?? a.triggerType}
                  </span>
                  {a.template && (
                    <span className="text-xs text-gray-500">Template: {a.template.name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.isActive ? 'bg-emerald-400/15 text-emerald-400' : 'bg-gray-400/15 text-gray-400'}`}>
                  {a.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-5 bg-[#C9A14A]/5 border border-[#C9A14A]/20 rounded-xl">
        <p className="text-sm text-[#C9A14A] font-medium mb-1">Em breve</p>
        <p className="text-sm text-gray-400">
          O criador visual de automações estará disponível em breve. Por enquanto, as automações podem ser configuradas via API.
        </p>
      </div>
    </div>
  )
}
