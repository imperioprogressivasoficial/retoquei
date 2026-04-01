'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Check, CreditCard, Loader2, Zap, TrendingUp, Building2, Users } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Plan = 'FREE' | 'STARTER' | 'GROWTH' | 'SCALE'

interface BillingData {
  currentPlan: Plan
  stripeCustomerId: string | null
  totalCustomers: number
  messagesSentThisMonth: number
}

interface PlanConfig {
  name: Plan
  label: string
  price: string | null
  priceId: string | null
  description: string
  features: string[]
  customerLimit: string
  messageLimit: string
  userLimit: string
  color: string
  badgeColor: string
  icon: React.ReactNode
}

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

const PLANS: PlanConfig[] = [
  {
    name: 'FREE',
    label: 'Grátis',
    price: null,
    priceId: null,
    description: 'Para começar a conhecer o Retoquei',
    features: [
      'Até 100 clientes',
      '50 mensagens/mês',
      '1 usuário',
      'Dashboard básico',
      'Importação CSV',
    ],
    customerLimit: '100 clientes',
    messageLimit: '50 mensagens/mês',
    userLimit: '1 usuário',
    color: 'border-border',
    badgeColor: 'bg-zinc-700 text-zinc-300',
    icon: <Users className="h-5 w-5" />,
  },
  {
    name: 'STARTER',
    label: 'Starter',
    price: 'R$ 97/mês',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? null,
    description: 'Para salões em crescimento',
    features: [
      'Até 500 clientes',
      '500 mensagens/mês',
      '3 usuários',
      'Automações básicas',
      'Segmentação de clientes',
      'Suporte por e-mail',
    ],
    customerLimit: '500 clientes',
    messageLimit: '500 mensagens/mês',
    userLimit: '3 usuários',
    color: 'border-blue-500/40',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    name: 'GROWTH',
    label: 'Growth',
    price: 'R$ 197/mês',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH ?? null,
    description: 'Para salões estabelecidos',
    features: [
      'Até 2.000 clientes',
      '2.000 mensagens/mês',
      '5 usuários',
      'Automações avançadas',
      'Campanhas ilimitadas',
      'Integração Trinks',
      'Suporte prioritário',
    ],
    customerLimit: '2.000 clientes',
    messageLimit: '2.000 mensagens/mês',
    userLimit: '5 usuários',
    color: 'border-[#C9A14A]/40',
    badgeColor: 'bg-[#C9A14A]/20 text-[#C9A14A]',
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    name: 'SCALE',
    label: 'Scale',
    price: 'R$ 397/mês',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SCALE ?? null,
    description: 'Para redes e grandes salões',
    features: [
      'Clientes ilimitados',
      '10.000 mensagens/mês',
      'Usuários ilimitados',
      'Tudo do Growth',
      'API de integração',
      'Gerente de conta dedicado',
      'SLA garantido',
    ],
    customerLimit: 'Ilimitados',
    messageLimit: '10.000 mensagens/mês',
    userLimit: 'Ilimitados',
    color: 'border-purple-500/40',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    icon: <Building2 className="h-5 w-5" />,
  },
]

const PLAN_ORDER: Plan[] = ['FREE', 'STARTER', 'GROWTH', 'SCALE']

function planBadge(plan: Plan) {
  const config = PLANS.find((p) => p.name === plan)!
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.badgeColor}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      setToast({ message: 'Assinatura ativada com sucesso!', type: 'success' })
      window.history.replaceState({}, '', '/billing')
    } else if (params.get('cancelled') === 'true') {
      setToast({ message: 'Checkout cancelado.', type: 'error' })
      window.history.replaceState({}, '', '/billing')
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    fetch('/api/billing/info')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ currentPlan: 'FREE', stripeCustomerId: null, totalCustomers: 0, messagesSentThisMonth: 0 }))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(priceId: string, planName: string) {
    setActionLoading(planName)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setToast({ message: json.error ?? 'Erro ao criar checkout.', type: 'error' })
        setActionLoading(null)
      }
    } catch {
      setToast({ message: 'Erro ao conectar com o servidor.', type: 'error' })
      setActionLoading(null)
    }
  }

  async function handleManageSubscription() {
    setActionLoading('portal')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setToast({ message: json.error ?? 'Erro ao abrir portal.', type: 'error' })
        setActionLoading(null)
      }
    } catch {
      setToast({ message: 'Erro ao conectar com o servidor.', type: 'error' })
      setActionLoading(null)
    }
  }

  const currentPlanIndex = data ? PLAN_ORDER.indexOf(data.currentPlan) : 0

  return (
    <div>
      <TopBar title="Plano & Cobrança" />

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="p-6 max-w-5xl mx-auto space-y-8">

        {/* Current plan summary */}
        <div className="rounded-xl border border-border bg-[#1E1E1E] p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando informações do plano...
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Plano atual</p>
                {planBadge(data?.currentPlan ?? 'FREE')}
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {new Intl.NumberFormat('pt-BR').format(data?.totalCustomers ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Clientes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {new Intl.NumberFormat('pt-BR').format(data?.messagesSentThisMonth ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Msgs este mês</p>
                </div>
              </div>

              {data?.currentPlan !== 'FREE' && data?.stripeCustomerId && (
                <button
                  onClick={handleManageSubscription}
                  disabled={actionLoading === 'portal'}
                  className="flex items-center gap-2 rounded-lg border border-border bg-[#2A2A2A] px-4 py-2 text-sm font-medium text-white hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'portal' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Gerenciar Assinatura
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pricing cards */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">Escolha seu plano</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const isCurrent = data?.currentPlan === plan.name
              const planIdx = PLAN_ORDER.indexOf(plan.name)
              const isDowngrade = planIdx < currentPlanIndex
              const isUpgrade = planIdx > currentPlanIndex

              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-xl border bg-[#1E1E1E] p-5 transition-all ${
                    isCurrent
                      ? `${plan.color} ring-1 ring-inset ${plan.color.replace('border-', 'ring-')}`
                      : 'border-border hover:border-zinc-600'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-4">
                      <span className="rounded-full bg-[#1E1E1E] px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                        Plano atual
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${plan.badgeColor} rounded-md p-1`}>{plan.icon}</span>
                      <span className="text-sm font-semibold text-white">{plan.label}</span>
                    </div>
                    {plan.price ? (
                      <p className="text-2xl font-bold text-white mt-2">{plan.price}</p>
                    ) : (
                      <p className="text-2xl font-bold text-white mt-2">Grátis</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  </div>

                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                        <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="mt-auto rounded-lg bg-[#2A2A2A] px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                      Plano ativo
                    </div>
                  ) : isUpgrade && plan.priceId ? (
                    <button
                      onClick={() => handleUpgrade(plan.priceId!, plan.name)}
                      disabled={!!actionLoading}
                      className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-[#C9A14A] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d4ac55] transition-colors disabled:opacity-50"
                    >
                      {actionLoading === plan.name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Fazer upgrade
                    </button>
                  ) : isDowngrade ? (
                    <div className="mt-auto rounded-lg border border-border px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                      Downgrade via portal
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* Note about prices */}
        <p className="text-xs text-muted-foreground text-center">
          Preços em Reais (BRL). Cobranças mensais, cancelamento a qualquer momento.
          Os pagamentos são processados de forma segura pelo Stripe.
        </p>
      </div>
    </div>
  )
}
