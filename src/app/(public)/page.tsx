import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  Link2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { RetoqueiLogoMark, RetoqueiWordmark } from '@/components/ui/RetoqueiLogo'

const features = [
  {
    icon: Link2,
    title: 'Conecte',
    description:
      'Importe seu histórico de agendamentos via CSV, webhook ou integração direta com sistemas como Trinks. Sem atrito, sem perda de dados.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: BarChart3,
    title: 'Analise',
    description:
      'Identifique automaticamente clientes Novos, Ativos, VIP, Em Risco e Perdidos. Visualize padrões de retorno e LTV em tempo real.',
    color: 'text-[#C9A14A]',
    bg: 'bg-[#C9A14A]/10',
  },
  {
    icon: Bot,
    title: 'Automatize',
    description:
      'Dispare mensagens personalizadas no WhatsApp no momento certo: reativação, aniversário, pós-visita, risco de churn. Zero esforço manual.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
]

const stats = [
  { value: '500+', label: 'Salões ativos', icon: Users },
  { value: '87%', label: 'Aumento na retenção', icon: TrendingUp },
  { value: '2.4x', label: 'Mais visitas por cliente', icon: Sparkles },
  { value: '48h', label: 'Para ver resultados', icon: Zap },
]

const steps = [
  {
    step: '01',
    title: 'Conecte seu sistema de agendamento',
    description:
      'Importe seu histórico em minutos via CSV ou conecte diretamente via webhook. Suporte a Trinks, Booksy e sistemas personalizados.',
  },
  {
    step: '02',
    title: 'Retoquei classifica seus clientes',
    description:
      'Nosso motor analisa padrões de visita, calcula LTV e segmenta automaticamente cada cliente no ciclo correto de lifecycle.',
  },
  {
    step: '03',
    title: 'Flows de retenção em ação',
    description:
      'Mensagens personalizadas no WhatsApp disparam automaticamente: reativação de inativos, fidelização de VIPs, recuperação de perdidos.',
  },
]

const testimonials = [
  {
    quote:
      'Em 30 dias, recuperei 23 clientes que não vinham há mais de 60 dias. O ROI foi imediato.',
    name: 'Carla Mendes',
    role: 'Proprietária, Studio CM',
    avatar: 'CM',
  },
  {
    quote:
      'Antes eu não sabia quais clientes estavam sumindo. Agora recebo alertas antes de perdê-los.',
    name: 'Rodrigo Alves',
    role: 'Gerente, Barber Palace',
    avatar: 'RA',
  },
  {
    quote:
      'A automação de WhatsApp sozinha já pagou o plano em 2 semanas. Recomendo para qualquer salão.',
    name: 'Fernanda Costa',
    role: 'Sócia, Salão FC',
    avatar: 'FC',
  },
]

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-24 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9A14A]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#C9A14A]/30 bg-[#C9A14A]/10 px-4 py-1.5 text-sm font-medium text-[#C9A14A]">
          <Sparkles className="h-3.5 w-3.5" />
          Motor de Retenção para Salões de Beleza
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Transforme histórico de{' '}
          <span className="gold-text">agendamentos</span> em clientes que{' '}
          <span className="gold-text">voltam</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Retoquei conecta ao seu sistema de agendamento, identifica clientes em
          risco e dispara mensagens personalizadas no WhatsApp — automaticamente.
          Menos churn, mais recorrência.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="btn-primary flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold shadow-lg shadow-[#C9A14A]/20"
          >
            Começar grátis — sem cartão
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/#how-it-works"
            className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium text-muted-foreground transition-all hover:border-border/80 hover:text-foreground"
          >
            Ver como funciona
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          14 dias grátis · Sem cartão de crédito · Cancele quando quiser
        </p>

        {/* Dashboard preview mockup */}
        <div className="relative mt-20 w-full max-w-5xl mx-auto">
          <div className="rounded-xl border border-border bg-card/50 p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <div className="ml-2 h-5 w-48 rounded bg-border/50 shimmer-bg" />
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {['Total Clientes', 'Ativos', 'Em Risco', 'LTV Médio'].map((label, i) => (
                <div key={label} className="rounded-lg border border-border bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className={`text-xl font-bold ${i === 2 ? 'text-amber-400' : i === 3 ? 'text-[#C9A14A]' : 'text-foreground'}`}>
                    {['1.284', '847', '213', 'R$847'].at(i)}
                  </div>
                  <div className="text-xs text-emerald-400">+12.3%</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 rounded-lg border border-border bg-muted/50 h-32 flex items-center justify-center">
                <div className="text-muted-foreground text-sm">Evolução de Clientes</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 h-32 flex items-center justify-center">
                <div className="text-muted-foreground text-sm">Distribuição</div>
              </div>
            </div>
          </div>
          {/* Glow under dashboard */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-[#C9A14A]/10 blur-2xl rounded-full" />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/30 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="flex flex-col items-center text-center">
                  <Icon className="mb-3 h-6 w-6 text-[#C9A14A]" />
                  <div className="text-3xl font-black text-foreground">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-4">
              <CheckCircle className="h-3.5 w-3.5 text-[#C9A14A]" />
              Tudo que você precisa
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Retenção inteligente em 3 etapas
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Retoquei automatiza o ciclo completo de retenção: da identificação de clientes
              em risco até o disparo da mensagem certa no momento certo.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:shadow-lg hover:shadow-black/20 group"
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-4 transition-all group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-card/20 py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Como funciona</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Configure uma vez, funciona para sempre. Sem complexidade.
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connecting line */}
            <div className="absolute top-8 left-1/6 right-1/6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />

            {steps.map((step, i) => (
              <div key={step.step} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C9A14A]/50 bg-card text-xl font-black text-[#C9A14A] shadow-lg shadow-[#C9A14A]/10 mb-6">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Salões que confiam no Retoquei
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4"
              >
                <div className="flex text-[#C9A14A]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-lg">★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C9A14A]/20 text-xs font-bold text-[#C9A14A]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-2xl border border-[#C9A14A]/20 bg-gradient-to-br from-[#C9A14A]/10 via-card to-card p-12 text-center">
            {/* Decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#C9A14A]/20 blur-3xl" />

            <ShieldCheck className="mx-auto mb-6 h-12 w-12 text-[#C9A14A]" />
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">
              Comece a reter clientes hoje
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              14 dias grátis, sem cartão de crédito. Configure em menos de 10 minutos
              e veja seus clientes voltando.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="btn-primary flex items-center gap-2 rounded-lg px-8 py-3.5 text-base font-semibold shadow-xl shadow-[#C9A14A]/25"
              >
                Começar trial gratuito
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Já tenho uma conta →
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> 14 dias grátis</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="container mx-auto">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4">
                <RetoqueiWordmark height={32} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Motor de retenção inteligente para salões de beleza.
              </p>
            </div>

            {[
              {
                title: 'Produto',
                links: ['Funcionalidades', 'Preços', 'Changelog', 'Roadmap'],
              },
              {
                title: 'Empresa',
                links: ['Sobre', 'Blog', 'Parceiros', 'Contato'],
              },
              {
                title: 'Legal',
                links: ['Privacidade', 'Termos', 'Segurança', 'LGPD'],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Retoquei. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Suporte via WhatsApp · contato@retoquei.com.br
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
