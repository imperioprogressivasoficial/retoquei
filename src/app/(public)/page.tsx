'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  ChevronDown,
  Link2,
  MessageSquare,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  Clock,
  Star,
  Phone,
  CalendarCheck,
  HeartHandshake,
  XCircle,
} from 'lucide-react'
import { RetoqueiLogoMark, RetoqueiWordmark } from '@/components/ui/RetoqueiLogo'

// ─── Data ──────────────────────────────────────────────────────────────────

const problems = [
  { icon: AlertTriangle, text: 'Clientes somem e você só percebe meses depois' },
  { icon: Clock, text: 'Fica sem tempo para ligar ou mandar mensagem manual' },
  { icon: XCircle, text: 'Não sabe quais clientes estão em risco de churn' },
  { icon: BarChart3, text: 'Não tem visibilidade de métricas como LTV e recorrência' },
]

const features = [
  {
    icon: Link2,
    title: 'Importe em minutos',
    description: 'Suba sua planilha CSV ou conecte via webhook. O histórico de agendamentos vira inteligência de negócio imediatamente.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    metrics: 'Setup em < 10min',
  },
  {
    icon: BarChart3,
    title: 'Segmentação automática',
    description: 'Cada cliente é classificado: Novo, Ativo, VIP, Em Risco ou Perdido. O motor calcula LTV, frequência e probabilidade de retorno.',
    color: 'text-[#C9A14A]',
    bg: 'bg-[#C9A14A]/10',
    border: 'border-[#C9A14A]/20',
    metrics: '7 segmentos inteligentes',
  },
  {
    icon: Bot,
    title: 'WhatsApp automático',
    description: 'Mensagens personalizadas no momento certo: reativação de inativos, parabéns, pós-visita, upsell de serviço. Zero esforço.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    metrics: '7 flows prontos para usar',
  },
]

const steps = [
  {
    num: '01',
    icon: CalendarCheck,
    title: 'Conecte seu histórico',
    description: 'Suba a planilha do seu sistema atual. Suportamos CSV, Trinks e webhooks. Leva menos de 10 minutos.',
  },
  {
    num: '02',
    icon: BarChart3,
    title: 'Retoquei analisa tudo',
    description: 'Nosso motor processa o histórico inteiro e classifica cada cliente com LTV, risco de churn e próxima visita prevista.',
  },
  {
    num: '03',
    icon: Bot,
    title: 'Automações em ação',
    description: 'Clientes em risco recebem mensagem de retorno. VIPs recebem exclusividade. Inativos voltam. Tudo no piloto automático.',
  },
]

const testimonials = [
  {
    quote: 'Em 30 dias recuperei 23 clientes que não vinham há mais de 60 dias. O ROI foi imediato — a ferramenta se pagou na primeira semana.',
    name: 'Carla Mendes',
    role: 'Proprietária',
    salon: 'Studio CM, São Paulo',
    avatar: 'CM',
    stars: 5,
    metric: '+23 clientes recuperados',
  },
  {
    quote: 'Antes eu não sabia quais clientes estavam sumindo. Agora recebo alertas com 2 semanas de antecedência e consigo agir antes de perder o cliente.',
    name: 'Rodrigo Alves',
    role: 'Gerente',
    salon: 'Barber Palace, Curitiba',
    avatar: 'RA',
    stars: 5,
    metric: '40% menos churn',
  },
  {
    quote: 'A automação de WhatsApp sozinha já pagou o plano 3x em 2 meses. Minha recorrência subiu de 45% para 71%. Recomendo pra qualquer salão.',
    name: 'Fernanda Costa',
    role: 'Sócia-fundadora',
    salon: 'Salão Fernanda Costa, BH',
    avatar: 'FC',
    stars: 5,
    metric: 'Recorrência +58%',
  },
]

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
      'Suporte por email',
    ],
    missing: ['Webhook / API', 'Multi-unidade'],
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
      'Webhook + API',
      'Analytics avançado',
      'WhatsApp QR Code',
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
      'Gerente de conta',
    ],
    missing: [],
    cta: 'Falar com vendas',
    href: 'https://wa.me/5511999999999',
    highlighted: false,
  },
]

const faqs = [
  {
    q: 'Preciso mudar meu sistema de agendamento?',
    a: 'Não. O Retoquei se conecta ao que você já usa. Basta exportar uma planilha CSV do seu sistema atual e fazer o upload. Suportamos Trinks, Booksy e qualquer outro via webhook.',
  },
  {
    q: 'Como o WhatsApp funciona?',
    a: 'Você conecta seu próprio número de WhatsApp via QR Code (igual ao WhatsApp Web). As mensagens saem do seu número, com o nome do seu salão. Não precisa de conta Business ou API paga da Meta.',
  },
  {
    q: 'Em quanto tempo vejo resultados?',
    a: 'A maioria dos clientes vê os primeiros clientes retornando em 7 a 14 dias após configurar os fluxos. O impacto na retenção fica evidente no primeiro mês completo.',
  },
  {
    q: 'O Retoquei envia spam para meus clientes?',
    a: 'Nunca. Os fluxos são baseados no comportamento real de cada cliente. Uma mensagem é enviada apenas quando faz sentido — por exemplo, quando um cliente ultrapassa o tempo médio sem visita.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Sem multa, sem carência. Se cancelar, seus dados ficam disponíveis para exportação por 30 dias.',
  },
  {
    q: 'Os dados dos meus clientes ficam seguros?',
    a: 'Sim. Usamos Supabase com criptografia em repouso e em trânsito, RLS (Row Level Security) por tenant, e seguimos as diretrizes da LGPD.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-20">
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-gradient-to-b from-[#C9A14A]/10 via-transparent to-transparent rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative rounded-2xl border border-white/10 bg-[#111111] shadow-2xl overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#0E0E0E]">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
          <div className="mx-auto flex items-center gap-2 rounded-md bg-white/[0.04] px-4 py-1 text-xs text-white/30">
            <span>🔒</span> retoquei.vercel.app/dashboard
          </div>
        </div>

        <div className="flex">
          {/* Sidebar mini */}
          <div className="hidden sm:flex w-14 flex-col items-center gap-4 border-r border-white/[0.05] bg-[#0A0A0A] py-4">
            <div className="h-7 w-7 rounded-lg bg-[#C9A14A]/20 flex items-center justify-center">
              <RetoqueiLogoMark size={16} />
            </div>
            {[BarChart3, Users, Bot, MessageSquare].map((Icon, i) => (
              <div key={i} className={`h-8 w-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-[#C9A14A]/15' : 'hover:bg-white/[0.04]'}`}>
                <Icon className={`h-4 w-4 ${i === 0 ? 'text-[#C9A14A]' : 'text-white/20'}`} />
              </div>
            ))}
          </div>

          {/* Dashboard content */}
          <div className="flex-1 p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs text-white/40">Salão Aurora</p>
                <h3 className="text-sm font-semibold text-white">Dashboard</h3>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                3 clientes recuperados hoje
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Total Clientes', value: '1.284', change: '+47', color: 'text-white' },
                { label: 'Ativos', value: '847', change: '+12%', color: 'text-emerald-400' },
                { label: 'Em Risco', value: '213', change: '⚠ 16%', color: 'text-amber-400' },
                { label: 'LTV Médio', value: 'R$847', change: '+8%', color: 'text-[#C9A14A]' },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[10px] text-white/40 mb-1">{kpi.label}</p>
                  <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{kpi.change}</p>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] text-white/40 mb-2">Evolução de Clientes — 12 meses</p>
                {/* Fake sparkline */}
                <svg viewBox="0 0 200 50" className="w-full h-14" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A14A" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#C9A14A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,40 L16,36 L33,32 L50,30 L66,28 L83,24 L100,22 L116,18 L133,15 L150,14 L166,10 L183,8 L200,5" stroke="#C9A14A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M0,40 L16,36 L33,32 L50,30 L66,28 L83,24 L100,22 L116,18 L133,15 L150,14 L166,10 L183,8 L200,5 L200,50 L0,50Z" fill="url(#grad)" />
                </svg>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] text-white/40 mb-2">Segmentos</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Ativos', pct: 66, color: 'bg-emerald-500' },
                    { label: 'Em Risco', pct: 16, color: 'bg-amber-500' },
                    { label: 'VIP', pct: 8, color: 'bg-[#C9A14A]' },
                    { label: 'Perdidos', pct: 10, color: 'bg-red-500' },
                  ].map((seg) => (
                    <div key={seg.label} className="flex items-center gap-2">
                      <div className="w-12 text-[9px] text-white/30 shrink-0">{seg.label}</div>
                      <div className="flex-1 rounded-full bg-white/[0.05] h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${seg.color}`} style={{ width: `${seg.pct}%` }} />
                      </div>
                      <div className="text-[9px] text-white/30 w-6 text-right">{seg.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent automations */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] text-white/40 mb-2">Automações recentes</p>
              <div className="space-y-1.5">
                {[
                  { name: 'Maria S.', msg: 'Mensagem de reativação', time: '2min', status: 'Lida', color: 'text-emerald-400' },
                  { name: 'João P.', msg: 'Lembrete de retorno', time: '14min', status: 'Entregue', color: 'text-blue-400' },
                  { name: 'Ana L.', msg: 'Parabéns aniversário', time: '1h', status: 'Enviada', color: 'text-white/40' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3 text-[10px]">
                    <div className="h-5 w-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[8px] text-white/40 shrink-0">
                      {item.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-white/60 flex-1 truncate">{item.name} · {item.msg}</span>
                    <span className="text-white/20">{item.time}</span>
                    <span className={item.color}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border border-border rounded-xl overflow-hidden transition-all"
      onClick={() => setOpen(!open)}
    >
      <button className="flex w-full items-center justify-between p-5 text-left gap-4">
        <span className="text-sm font-medium text-white">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-20 text-center">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#C9A14A]/6 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,#0B0B0B_100%)]" />
        </div>

        {/* Badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#C9A14A]/30 bg-[#C9A14A]/10 px-4 py-1.5 text-sm font-medium text-[#C9A14A] shadow-lg shadow-[#C9A14A]/5">
          <Sparkles className="h-3.5 w-3.5" />
          Novo · Motor de retenção com IA para salões
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[72px]">
          Seus clientes somem.<br />
          <span className="relative inline-block">
            <span className="gold-text">Retoquei</span>{' '}
          </span>
          traz eles de volta.
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/55 sm:text-xl">
          Conecte seu histórico de agendamentos, identifique quem está em risco de churn
          e dispare mensagens personalizadas no WhatsApp — sem esforço manual.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#C9A14A] to-[#B08530] px-7 py-3.5 text-base font-semibold text-[#0B0B0B] shadow-xl shadow-[#C9A14A]/25 transition-all hover:shadow-[#C9A14A]/40 hover:-translate-y-0.5"
          >
            Começar grátis — 14 dias
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#how-it-works"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-base font-medium text-white/60 transition-all hover:border-white/20 hover:text-white"
          >
            Ver como funciona
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/25">
          Sem cartão de crédito · Cancele quando quiser · Setup em menos de 10 minutos
        </p>

        {/* Dashboard Mockup */}
        <DashboardMockup />
      </section>

      {/* ── PROBLEMA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.04] p-10">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-3">O problema real</p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Você perde clientes todo mês sem perceber
              </h2>
              <p className="mt-3 text-white/40 max-w-xl mx-auto text-sm">
                Salões de beleza têm taxa de churn média de 40% ao ano. A maioria dos donos descobre que perdeu um cliente só quando já é tarde demais.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {problems.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3">
                  <Icon className="h-4 w-4 text-red-400 shrink-0" />
                  <span className="text-sm text-white/70">{text}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A14A]/30 bg-[#C9A14A]/10 px-5 py-2 text-sm font-medium text-[#C9A14A]">
                <HeartHandshake className="h-4 w-4" />
                O Retoquei resolve cada um desses problemas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.05] bg-white/[0.02] py-14">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: '500+', label: 'Salões ativos', icon: Users },
              { value: '87%', label: 'Aumento na retenção', icon: TrendingUp },
              { value: '2.4x', label: 'Mais visitas por cliente', icon: Sparkles },
              { value: '48h', label: 'Para ver os primeiros resultados', icon: Zap },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="flex flex-col items-center text-center gap-2">
                  <Icon className="h-5 w-5 text-[#C9A14A] mb-1" />
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-white/40 max-w-[120px]">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A14A] mb-3">Como funciona</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Retenção inteligente em 3 etapas
            </h2>
            <p className="mt-4 text-white/40 max-w-xl mx-auto">
              Conecte, analise e automatize. Tudo em uma plataforma, sem precisar de time de marketing.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`group relative rounded-2xl border ${feature.border} bg-gradient-to-b from-white/[0.04] to-transparent p-7 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30`}
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-5 transition-all group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div className={`mb-3 text-xs font-semibold ${feature.color}`}>{feature.metrics}</div>
                  <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-white/45">{feature.description}</p>
                  <div className="absolute top-4 right-4 text-5xl font-black text-white/[0.03] select-none">0{i + 1}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white/[0.02] py-28 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A14A] mb-3">Passo a passo</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Configure uma vez, funciona sempre</h2>
            <p className="mt-4 text-white/40 max-w-lg mx-auto">
              Sem código, sem complexidade. Em menos de 30 minutos você já tem seu primeiro fluxo rodando.
            </p>
          </div>

          <div className="relative space-y-6">
            {/* Vertical line */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-[#C9A14A]/40 via-[#C9A14A]/20 to-transparent hidden sm:block" />

            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="flex gap-6 items-start">
                  <div className="relative z-10 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-[#C9A14A]/30 bg-[#C9A14A]/10 shadow-lg shadow-[#C9A14A]/10">
                    <Icon className="h-6 w-6 text-[#C9A14A]" />
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                    <div className="text-xs font-bold text-[#C9A14A]/60 mb-1">{step.num}</div>
                    <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-white/45">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A14A] to-[#B08530] px-7 py-3.5 text-sm font-semibold text-[#0B0B0B] shadow-lg shadow-[#C9A14A]/20 hover:shadow-[#C9A14A]/40 transition-all hover:-translate-y-0.5"
            >
              Começar agora — grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A14A] mb-3">Depoimentos</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Salões que transformaram sua retenção
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 transition-all hover:border-[#C9A14A]/20 hover:shadow-xl hover:shadow-black/20"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#C9A14A] text-[#C9A14A]" />
                  ))}
                </div>

                {/* Metric highlight */}
                <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#C9A14A]/10 border border-[#C9A14A]/20 px-3 py-1 text-xs font-semibold text-[#C9A14A]">
                  <TrendingUp className="h-3 w-3" />
                  {t.metric}
                </div>

                <p className="flex-1 text-sm leading-relaxed text-white/55 italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C9A14A]/20 text-xs font-bold text-[#C9A14A]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/35">{t.role} · {t.salon}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-white/[0.02] py-28 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A14A] mb-3">Planos</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Preços simples e transparentes
            </h2>
            <p className="mt-4 text-white/40">
              Sem taxa de setup · Sem contrato mínimo · Cancele quando quiser
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                  plan.highlighted
                    ? 'border-[#C9A14A]/40 bg-gradient-to-b from-[#C9A14A]/8 to-[#C9A14A]/[0.03] shadow-xl shadow-[#C9A14A]/10'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A14A] px-4 py-1 text-xs font-bold text-[#0B0B0B] shadow-lg shadow-[#C9A14A]/30">
                      <Star className="h-3 w-3 fill-current" /> Mais popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{plan.description}</p>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-white/40 text-sm mb-1">{plan.per}</span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">14 dias grátis para começar</p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
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
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-[#C9A14A] to-[#B08530] text-[#0B0B0B] shadow-lg shadow-[#C9A14A]/20 hover:shadow-[#C9A14A]/40 hover:-translate-y-0.5'
                      : 'border border-white/10 text-white hover:border-[#C9A14A]/30 hover:text-[#C9A14A]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-white/25 mt-8">
            Todos os planos incluem 14 dias grátis. Sem necessidade de cartão de crédito.
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A14A] mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-[#C9A14A]/20 bg-gradient-to-br from-[#C9A14A]/10 via-[#C9A14A]/5 to-transparent p-12 text-center">
            {/* Decorative */}
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#C9A14A]/15 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl" />

            <div className="relative">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C9A14A]/30 bg-[#C9A14A]/15 shadow-xl shadow-[#C9A14A]/20">
                <RetoqueiLogoMark size={32} />
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
                Comece a reter clientes hoje
              </h2>
              <p className="text-white/50 max-w-lg mx-auto mb-8 leading-relaxed">
                14 dias grátis, sem cartão de crédito. Configure em menos de 10 minutos
                e veja seus primeiros clientes voltando ainda esta semana.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#C9A14A] to-[#B08530] px-8 py-4 text-base font-semibold text-[#0B0B0B] shadow-xl shadow-[#C9A14A]/30 transition-all hover:shadow-[#C9A14A]/50 hover:-translate-y-0.5"
                >
                  Começar trial gratuito
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Já tenho conta →
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-white/30">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> 14 dias grátis
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Sem cartão de crédito
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Cancele quando quiser
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-400" /> LGPD compliant
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-14 px-6">
        <div className="container mx-auto">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="mb-4">
                <RetoqueiWordmark height={32} />
              </div>
              <p className="text-sm text-white/35 leading-relaxed max-w-xs">
                Motor de retenção inteligente para salões de beleza. Menos churn, mais recorrência.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-white/25">
                <Phone className="h-3.5 w-3.5" />
                Suporte via WhatsApp
              </div>
            </div>

            {[
              { title: 'Produto', links: [{ label: 'Funcionalidades', href: '/#features' }, { label: 'Preços', href: '/pricing' }, { label: 'Como funciona', href: '/#how-it-works' }] },
              { title: 'Empresa', links: [{ label: 'Sobre', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Contato', href: '/contact' }] },
              { title: 'Legal', links: [{ label: 'Privacidade', href: '#' }, { label: 'Termos', href: '#' }, { label: 'LGPD', href: '#' }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-white/35 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/20">
              © {new Date().getFullYear()} Retoquei. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-white/20">
              <MessageSquare className="h-3 w-3" />
              contato@retoquei.com.br
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
