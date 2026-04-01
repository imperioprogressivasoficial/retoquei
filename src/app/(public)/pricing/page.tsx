import Link from 'next/link'
import { ArrowRight, CheckCircle, XCircle, Star, Zap, MessageSquare, BarChart3, Shield, HeartHandshake } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'R$197',
    per: '/mês',
    description: 'Para salões em crescimento',
    features: [
      'Até 500 clientes ativos',
      '3 fluxos de automação',
      'Importação via CSV',
      'Dashboard + relatórios',
      'Segmentação automática',
      'Suporte por email',
    ],
    missing: ['WhatsApp via QR Code', 'Webhook / API', 'Multi-unidade'],
    cta: 'Começar grátis',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: 'R$397',
    per: '/mês',
    description: 'O favorito dos salões estabelecidos',
    features: [
      'Até 2.000 clientes ativos',
      'Fluxos ilimitados',
      'WhatsApp via QR Code',
      'Webhook + API',
      'Analytics avançado',
      'IA para geração de mensagens',
      'Suporte prioritário',
    ],
    missing: ['Multi-unidade'],
    cta: 'Começar grátis',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Scale',
    price: 'R$797',
    per: '/mês',
    description: 'Para redes e franquias',
    features: [
      'Clientes ilimitados',
      'Multi-unidade',
      'API avançada + webhooks',
      'Onboarding dedicado',
      'SLA 99.9% garantido',
      'Gerente de conta exclusivo',
      'Relatórios personalizados',
    ],
    missing: [],
    cta: 'Falar com vendas',
    href: 'https://wa.me/5511999999999',
    highlighted: false,
  },
]

const features = [
  { label: 'Clientes ativos', starter: '500', growth: '2.000', scale: 'Ilimitado' },
  { label: 'Fluxos de automação', starter: '3', growth: 'Ilimitados', scale: 'Ilimitados' },
  { label: 'Importação CSV', starter: true, growth: true, scale: true },
  { label: 'Dashboard + relatórios', starter: true, growth: true, scale: true },
  { label: 'Segmentação automática', starter: true, growth: true, scale: true },
  { label: 'WhatsApp QR Code', starter: false, growth: true, scale: true },
  { label: 'Webhook / API', starter: false, growth: true, scale: true },
  { label: 'IA para mensagens', starter: false, growth: true, scale: true },
  { label: 'Multi-unidade', starter: false, growth: false, scale: true },
  { label: 'Onboarding dedicado', starter: false, growth: false, scale: true },
  { label: 'SLA garantido', starter: false, growth: false, scale: true },
]

const guarantees = [
  { icon: Shield, title: 'Sem contrato mínimo', desc: 'Cancele quando quiser, sem multa.' },
  { icon: Zap, title: '14 dias grátis', desc: 'Teste completo sem cartão de crédito.' },
  { icon: HeartHandshake, title: 'Suporte humano', desc: 'Time brasileiro, resposta rápida.' },
  { icon: MessageSquare, title: 'Migração assistida', desc: 'Te ajudamos a importar seus dados.' },
]

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value
      ? <CheckCircle className="h-4 w-4 text-[#C9A14A] mx-auto" />
      : <XCircle className="h-4 w-4 text-white/15 mx-auto" />
  }
  return <span className="text-sm text-white/70">{value}</span>
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] py-24 px-4">
      <div className="max-w-5xl mx-auto space-y-20">

        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A14A] mb-3">Preços</p>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Planos simples e transparentes
          </h1>
          <p className="text-white/40 mt-4 max-w-xl mx-auto">
            Sem taxa de setup. Sem contrato mínimo. Comece grátis por 14 dias.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                plan.highlighted
                  ? 'border-[#C9A14A]/40 bg-gradient-to-b from-[#C9A14A]/8 to-[#C9A14A]/[0.03] shadow-2xl shadow-[#C9A14A]/10'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A14A] px-4 py-1 text-xs font-bold text-[#0B0B0B] shadow-lg shadow-[#C9A14A]/30">
                    <Star className="h-3 w-3 fill-current" /> Mais popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                <p className="text-xs text-white/40 mt-0.5">{plan.description}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm mb-1">{plan.per}</span>
                </div>
                <p className="text-xs text-white/25 mt-1">14 dias grátis para começar</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/65">
                    <CheckCircle className="h-4 w-4 text-[#C9A14A] shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/20">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-[#C9A14A] to-[#B08530] text-[#0B0B0B] shadow-lg shadow-[#C9A14A]/20 hover:shadow-[#C9A14A]/40 hover:-translate-y-0.5'
                    : 'border border-white/10 text-white hover:border-[#C9A14A]/30 hover:text-[#C9A14A]'
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div>
          <h2 className="text-xl font-bold text-white text-center mb-8">Comparativo completo</h2>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                  <th className="text-left px-5 py-4 text-sm font-medium text-white/40">Funcionalidade</th>
                  {['Starter', 'Growth', 'Scale'].map((name, i) => (
                    <th key={name} className={`px-5 py-4 text-center text-sm font-semibold ${i === 1 ? 'text-[#C9A14A]' : 'text-white'}`}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((row, i) => (
                  <tr key={row.label} className={`border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="px-5 py-3.5 text-sm text-white/55">{row.label}</td>
                    <td className="px-5 py-3.5 text-center"><Cell value={row.starter} /></td>
                    <td className="px-5 py-3.5 text-center bg-[#C9A14A]/[0.03]"><Cell value={row.growth} /></td>
                    <td className="px-5 py-3.5 text-center"><Cell value={row.scale} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {guarantees.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
              <Icon className="h-6 w-6 text-[#C9A14A] mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-white/35 mt-1">{desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-white/40 text-sm mb-6">Ainda tem dúvidas? Fale com nosso time.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A14A] to-[#B08530] px-7 py-3.5 text-sm font-semibold text-[#0B0B0B] shadow-xl shadow-[#C9A14A]/20 hover:shadow-[#C9A14A]/40 transition-all hover:-translate-y-0.5"
            >
              Começar grátis agora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="https://wa.me/5511999999999"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-sm text-white/60 hover:border-white/20 hover:text-white transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              Falar com vendas
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
