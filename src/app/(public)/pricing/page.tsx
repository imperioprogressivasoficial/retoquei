import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'R$197',
    period: '/mês',
    description: 'Para salões em crescimento',
    features: ['Até 500 clientes', '3 fluxos de automação', 'Importação CSV', 'Suporte por email'],
    cta: 'Começar agora',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: 'R$397',
    period: '/mês',
    description: 'Para salões estabelecidos',
    features: ['Até 2.000 clientes', 'Fluxos ilimitados', 'Webhook / API', 'Analytics avançado', 'Suporte prioritário'],
    cta: 'Começar agora',
    highlighted: true,
  },
  {
    name: 'Scale',
    price: 'R$797',
    period: '/mês',
    description: 'Para redes e franquias',
    features: ['Clientes ilimitados', 'Multi-unidade', 'API avançada', 'Onboarding dedicado', 'SLA garantido'],
    cta: 'Falar com vendas',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white">Planos simples e transparentes</h1>
          <p className="text-muted-foreground mt-3">Sem taxa de setup. Cancele quando quiser.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-8 ${plan.highlighted ? 'border-gold bg-gold/5' : 'border-border bg-[#1E1E1E]'}`}>
              {plan.highlighted && (
                <span className="inline-block mb-4 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-[#0B0B0B]">Mais popular</span>
              )}
              <h2 className="text-lg font-bold text-white">{plan.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <div className="mt-5">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-gold shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-8 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${plan.highlighted ? 'bg-gold text-[#0B0B0B] hover:bg-gold/90' : 'border border-border text-white hover:border-gold/40'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
