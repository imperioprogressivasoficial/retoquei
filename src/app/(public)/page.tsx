'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight, BarChart3, Bot, CheckCircle, ChevronDown,
  MessageSquare, Sparkles, TrendingUp, Users, Zap,
  AlertTriangle, Star, Phone, CalendarCheck, Menu, X,
  Wifi, Clock, RefreshCw, Target, Award, ChevronRight,
  Play, Lock, GitBranch, Smartphone, Eye, Zap as ZapIcon,
} from 'lucide-react'
import { AnimatedSection } from '@/components/ui/AnimatedSection'

// Animations
const G = () => (
  <style>{`
    @keyframes float-y { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    @keyframes gradient-shift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    @keyframes slide-in { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
    @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

    .hero-gradient { background: linear-gradient(135deg, #C9A14A 0%, #E8C06A 50%, #A07D3A 100%); background-size: 200% 200%; }
    .card-hover { transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(201,161,74,0.2); border-color: rgba(201,161,74,0.5); }

    .nav-link { position: relative; color: rgba(255,255,255,0.7); transition: color 0.3s; }
    .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px; background: #C9A14A; transition: width 0.3s; }
    .nav-link:hover { color: #C9A14A; }
    .nav-link:hover::after { width: 100%; }

    .btn-gold { background: linear-gradient(135deg, #C9A14A, #E8C06A); color: #1a1a1a; font-weight: 600; transition: all 0.3s; box-shadow: 0 8px 20px rgba(201,161,74,0.3); }
    .btn-gold:hover { box-shadow: 0 12px 30px rgba(201,161,74,0.5); transform: translateY(-2px); }

    .btn-outline { border: 2px solid #C9A14A; color: #C9A14A; transition: all 0.3s; }
    .btn-outline:hover { background: rgba(201,161,74,0.1); }

    .gradient-text { background: linear-gradient(135deg, #C9A14A, #E8C06A); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

    .feature-icon { background: linear-gradient(135deg, rgba(201,161,74,0.2), rgba(232,192,106,0.1)); border: 1px solid rgba(201,161,74,0.3); }

    @media(max-width:768px) { .hide-mobile { display: none !important; } }
  `}</style>
)

function FloatingParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#C9A14A] opacity-5"
          style={{
            width: Math.random() * 100 + 50 + 'px',
            height: Math.random() * 100 + 50 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animation: `float-y ${15 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: Math.random() * 5 + 's',
          }}
        />
      ))}
    </div>
  )
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#C9A14A] to-[#E8C06A] flex items-center justify-center font-bold text-black">R</div>
          <span className="text-xl font-bold hidden sm:block">Retoquei</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#beneficios" className="nav-link text-sm">Benefícios</a>
          <a href="#recursos" className="nav-link text-sm">Recursos</a>
          <a href="#preco" className="nav-link text-sm">Preços</a>
          <a href="#depoimentos" className="nav-link text-sm">Depoimentos</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">Entrar</Link>
          <Link href="/register" className="btn-gold px-6 py-2 rounded-lg text-sm">Começar Grátis</Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-white/5 p-4 space-y-4">
          <a href="#beneficios" className="block text-sm text-white/70 hover:text-white">Benefícios</a>
          <a href="#recursos" className="block text-sm text-white/70 hover:text-white">Recursos</a>
          <a href="#preco" className="block text-sm text-white/70 hover:text-white">Preços</a>
          <Link href="/register" className="block btn-gold px-4 py-2 rounded-lg text-sm text-center">Começar Grátis</Link>
        </div>
      )}
    </header>
  )
}

function HeroSection() {
  return (
    <section className="min-h-screen pt-20 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#C9A14A]/10 via-transparent to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-block mb-8 px-4 py-2 rounded-full border border-[#C9A14A]/30 bg-[#C9A14A]/10">
          <p className="text-sm text-[#C9A14A] font-medium">✨ Empresa do Grupo Império</p>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
          Recupere seus <span className="gradient-text">clientes perdidos</span>
        </h1>

        <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
          Retoquei é a plataforma de automação que traz clientes de volta para seu salão automaticamente. Com IA e WhatsApp, aumente sua receita em até 40% em 90 dias.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link href="/register" className="btn-gold px-8 py-4 rounded-xl text-lg flex items-center gap-2 group">
            Começar Grátis <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 hover:border-[#C9A14A]/50 hover:bg-white/5 transition-all">
            <Play className="h-5 w-5 text-[#C9A14A]" /> Ver Demo (2 min)
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 pt-16 border-t border-white/10">
          <div>
            <p className="text-3xl sm:text-4xl font-bold gradient-text">+500</p>
            <p className="text-white/60 text-sm mt-2">Salões usando Retoquei</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold gradient-text">40%</p>
            <p className="text-white/60 text-sm mt-2">Aumento médio de receita</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold gradient-text">10k+</p>
            <p className="text-white/60 text-sm mt-2">Clientes recuperados/mês</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function BenefitSection() {
  const benefits = [
    {
      icon: Users,
      title: 'Recupere Clientes Automaticamente',
      desc: 'Nossa IA identifica clientes em risco e envia mensagens personalizadas no momento certo para trazer eles de volta.'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Automático e Inteligente',
      desc: 'Envie mensagens via WhatsApp em escala. Personalizadas, automáticas e com taxa de resposta de até 60%.'
    },
    {
      icon: TrendingUp,
      title: 'Aumento Comprovado de Receita',
      desc: 'Clientes recuperados geram em média R$ 450 em receita. Com Retoquei, sua carteira cresce consistentemente.'
    },
    {
      icon: Clock,
      title: 'Economize Tempo do Seu Tim',
      desc: 'Dispense sua vendedora para fazer prospecção. O sistema faz o trabalho 24/7 de forma inteligente.'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Completo em Tempo Real',
      desc: 'Acompanhe cada métrica: clientes recuperados, receita gerada, engajamento, tudo em um lugar.'
    },
    {
      icon: Zap,
      title: 'Setup Instantâneo',
      desc: 'Importe seus clientes em 5 minutos. Em 1 hora o sistema já está funcionando para você.'
    },
  ]

  return (
    <section id="beneficios" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black mb-6">
          Por que <span className="gradient-text">Retoquei é diferente</span>
        </h2>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          A única plataforma que combina IA, WhatsApp e análise de comportamento especificamente para salões de beleza.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((b, i) => (
          <div key={i} className="card-hover rounded-2xl p-8 border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
            <div className="feature-icon h-14 w-14 rounded-xl flex items-center justify-center mb-4">
              <b.icon className="h-7 w-7 text-[#C9A14A]" />
            </div>
            <h3 className="text-lg font-bold mb-2">{b.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: 'R$ 99',
      desc: 'Para salões pequenos',
      features: ['Até 500 clientes', '1 usuário', 'Suporte básico', 'Dashboard completo', 'WhatsApp ilimitado'],
      cta: 'Começar'
    },
    {
      name: 'Pro',
      price: 'R$ 299',
      desc: 'Mais popular',
      features: ['Até 2000 clientes', '5 usuários', 'Suporte prioritário', 'Relatórios avançados', 'API de integração', 'Fluxos customizados'],
      cta: 'Começar',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Sob demanda',
      desc: 'Para cadeias',
      features: ['Clientes ilimitados', 'Usuários ilimitados', 'Suporte 24/7', 'Onboarding dedicado', 'Integrações custom', 'Treinamento incluído'],
      cta: 'Falar com Sales'
    },
  ]

  return (
    <section id="preco" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black mb-6">
          Planos transparentes e <span className="gradient-text">sem surpresas</span>
        </h2>
        <p className="text-xl text-white/60">
          Escolha o plano que melhor se adequa ao seu salão. Cancele quando quiser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`card-hover rounded-2xl p-8 relative overflow-hidden border transition-all ${
              plan.highlighted
                ? 'border-[#C9A14A]/50 bg-gradient-to-br from-[#C9A14A]/20 via-[#C9A14A]/5 to-transparent ring-2 ring-[#C9A14A]/30'
                : 'border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute top-4 right-4 bg-[#C9A14A] text-black px-3 py-1 rounded-full text-xs font-bold">
                Popular
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-white/60 text-sm mb-4">{plan.desc}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                {plan.price !== 'Sob demanda' && <span className="text-white/60">/mês</span>}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-[#C9A14A] flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className={`w-full block text-center py-3 rounded-xl font-bold transition-all ${
                plan.highlighted
                  ? 'btn-gold'
                  : 'border border-white/20 hover:border-[#C9A14A]/50 hover:bg-white/5'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-16 p-6 rounded-2xl border border-white/10 bg-white/5 text-center">
        <p className="text-white/60 mb-2">🎁 Primeiros 14 dias são GRÁTIS. Sem cartão de crédito.</p>
        <p className="text-sm text-white/40">Já inclui todos os recursos. Cancele quando quiser.</p>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Marina Silva',
      salon: 'Salão Aurora',
      text: 'Retoquei me fez economizar R$ 3k/mês com vendedora e aumentou minha receita em 35% em 2 meses. Não consigo mais viver sem.',
      avatar: '👩‍🦰'
    },
    {
      name: 'Carolina Oliveira',
      salon: 'Studio Carol',
      text: 'A automação do WhatsApp é INCRÍVEL. Meus clientes dormindo recebem mensagens personalizadas. 60% de taxa de resposta!',
      avatar: '👩‍🦱'
    },
    {
      name: 'Beatriz Costa',
      salon: 'Beleza & Estética',
      text: 'Dashboard super intuitivo. Em 1 semana já sabia exatamente quais clientes recuperar. ROI em menos de 30 dias.',
      avatar: '👩'
    },
  ]

  return (
    <section id="depoimentos" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-black mb-6">
          Amado por <span className="gradient-text">salões em todo Brasil</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <div key={i} className="card-hover rounded-2xl p-8 border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">{t.avatar}</div>
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-white/60">{t.salon}</p>
              </div>
            </div>
            <p className="text-white/80 italic">"{t.text}"</p>
            <div className="flex gap-1 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[#C9A14A] text-[#C9A14A]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(201,161,74,0.15) 0%, rgba(232,192,106,0.08) 100%)' }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(201,161,74,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(232,192,106,0.2) 0%, transparent 50%)' }} />

        <div className="relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            Pronto para recuperar seus clientes?
          </h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            A maioria dos salões vê resultados em menos de 30 dias. Comece agora com 14 dias grátis.
          </p>

          <Link href="/register" className="btn-gold px-8 py-4 rounded-xl text-lg font-bold inline-flex items-center gap-2 group">
            Começar Meus 14 Dias Grátis <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="text-white/50 text-sm mt-6">
            Sem cartão de crédito. Sem compromisso. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <p className="font-bold mb-4">Retoquei</p>
            <p className="text-white/60 text-sm">Recuperando clientes, aumentando receita.</p>
          </div>
          <div>
            <p className="font-bold text-sm mb-4">Produto</p>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><a href="#recursos" className="hover:text-white transition">Recursos</a></li>
              <li><a href="#preco" className="hover:text-white transition">Preços</a></li>
              <li><a href="#" className="hover:text-white transition">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-sm mb-4">Empresa</p>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><a href="/contact" className="hover:text-white transition">Contato</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Sobre</a></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-sm mb-4">Legal</p>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center text-white/50 text-sm">
          <p>© 2026 Retoquei. Empresa do Grupo Império. Todos os direitos reservados.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-white transition">Twitter</a>
            <a href="#" className="hover:text-white transition">Instagram</a>
            <a href="#" className="hover:text-white transition">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      <G />
      <FloatingParticles />
      <Navbar />
      <HeroSection />
      <BenefitSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
