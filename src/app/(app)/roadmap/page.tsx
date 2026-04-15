import { Rocket, CheckCircle2, Clock, Circle } from 'lucide-react'

export const metadata = { title: 'Roadmap' }

const ROADMAP = [
  {
    phase: 'Lancado',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-400/20',
    icon: CheckCircle2,
    items: [
      'CRM de clientes com ciclo de vida',
      'Campanhas WhatsApp via template',
      'Segmentacao manual e dinamica',
      'Importacao CSV de clientes',
      'Toggle tema claro/escuro',
      'Selecao em massa + acoes bulk',
      'Integracao WhatsApp (QR + codigo)',
    ],
  },
  {
    phase: 'Em desenvolvimento',
    color: 'text-[#C9A14A]',
    borderColor: 'border-[#C9A14A]/20',
    icon: Clock,
    items: [
      'Motor de automacoes (triggers automaticos)',
      'Motor de regras de segmento avancado',
      'Dispatch assincrono de campanhas',
      'Campanhas agendadas',
      'Mensagem manual sem template',
      'Integracao Trinks via webhook',
    ],
  },
  {
    phase: 'Planejado',
    color: 'text-blue-400',
    borderColor: 'border-blue-400/20',
    icon: Circle,
    items: [
      'Calculo LTV por cliente',
      'Login via codigo WhatsApp (OTP)',
      'Rascunho e auto-save de campanhas',
      'Envio de midia (imagens/PDF)',
      'Timeline de interacoes do cliente',
      'Dashboard analytics avancado',
    ],
  },
]

export default function RoadmapPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Rocket className="h-6 w-6 text-[#C9A14A]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Roadmap</h1>
          <p className="text-gray-400 mt-0.5 text-sm">Acompanhe a evolucao da plataforma</p>
        </div>
      </div>

      <div className="space-y-6">
        {ROADMAP.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.phase} className={`bg-white/[0.03] border ${section.borderColor} rounded-xl p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`h-5 w-5 ${section.color}`} />
                <h2 className={`text-sm font-semibold ${section.color}`}>{section.phase}</h2>
              </div>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${section.color.replace('text-', 'bg-')} shrink-0`} />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
