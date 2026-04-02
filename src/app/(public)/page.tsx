'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight, BarChart3, Bot, CheckCircle, ChevronDown,
  MessageSquare, Sparkles, TrendingUp, Users, Zap,
  AlertTriangle, Star, Phone, CalendarCheck, Menu, X,
  Wifi, Clock, RefreshCw, Target, Award, ChevronRight,
} from 'lucide-react'
import { AnimatedSection, AnimatedCounter } from '@/components/ui/AnimatedSection'

// ─── Global styles ────────────────────────────────────────────────────────────
const G = () => (
  <style>{`
    @keyframes float-y {
      0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)}
    }
    @keyframes spin-slow {
      to{transform:rotate(360deg)}
    }
    @keyframes pulse-dot {
      0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.6}
    }
    @keyframes shimmer {
      0%{transform:translateX(-100%)} 100%{transform:translateX(200%)}
    }
    @keyframes slide-in {
      from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)}
    }
    @keyframes blink-cursor {
      0%,100%{opacity:1} 50%{opacity:0}
    }
    @keyframes gradient-x {
      0%,100%{background-position:0% 50%} 50%{background-position:100% 50%}
    }
    @keyframes ping-gold {
      0%{transform:scale(1);opacity:.4} 100%{transform:scale(2.2);opacity:0}
    }
    @keyframes bar-grow {
      from{height:0} to{height:var(--h)}
    }
    @keyframes count-up {
      from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)}
    }
    .gold-shimmer-btn::after {
      content:'';position:absolute;inset:0;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);
      transform:translateX(-100%);
      transition:transform .5s ease;
    }
    .gold-shimmer-btn:hover::after{transform:translateX(200%)}
    .card-hover{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
    .card-hover:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
    .nav-link{position:relative;color:rgba(255,255,255,.55);transition:color .2s}
    .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#C9A14A;transition:width .25s}
    .nav-link:hover{color:rgba(255,255,255,.9)}
    .nav-link:hover::after{width:100%}
    @media(max-width:767px){
      .hide-mobile{display:none!important}
      .stack-mobile{flex-direction:column!important;align-items:stretch!important}
      .stack-mobile > *{width:100%!important}
    }
  `}</style>
)

// ─── Cursor glow ──────────────────────────────────────────────────────────────
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.left = e.clientX + 'px'
        ref.current.style.top = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <div ref={ref} className="pointer-events-none fixed z-0 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full hide-mobile"
      style={{ background: 'radial-gradient(circle,rgba(201,161,74,.07) 0%,transparent 65%)', transition: 'left .12s ease,top .12s ease' }} />
  )
}

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles() {
  const items = useRef(
    Array.from({ length: 15 }, (_, i) => ({
      w: Math.random() * 2.5 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      op: Math.random() * 0.25 + 0.05,
      dur: Math.random() * 12 + 8,
      delay: Math.random() * 6,
    }))
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.current.map((p, i) => (
        <div key={i} className="absolute rounded-full bg-[#C9A14A]"
          style={{ width: p.w, height: p.w, left: p.left + '%', top: p.top + '%', opacity: p.op, animation: `float-y ${p.dur}s ${p.delay}s ease-in-out infinite` }} />
      ))}
    </div>
  )
}

// ─── Mobile menu ─────────────────────────────────────────────────────────────
function MobileMenu() {
  const [open, setOpen] = useState(false)
  const links = [
    { href: '#como-funciona', label: 'Como funciona' },
    { href: '#recursos', label: 'Recursos' },
    { href: '#precos', label: 'Preços' },
    { href: '#faq', label: 'FAQ' },
  ]
  return (
    <>
      <button onClick={() => setOpen(v => !v)} className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 border-t border-white/5 py-4 px-5 flex flex-col gap-1 z-50"
          style={{ background: '#080808', animation: 'slide-in .2s ease' }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="py-3 px-4 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
              {l.label}
            </a>
          ))}
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)}
              className="py-3 px-4 rounded-xl text-center text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
              Entrar
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}
              className="py-3 px-4 rounded-xl text-center text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#C9A14A,#E8C06A)' }}>
              Começar grátis
            </Link>
          </div>
        </div>
      )}
    </>
  )
}


// ─── Dashboard mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
  const [tick, setTick] = useState(0)
  const [msgTick, setMsgTick] = useState(0)

  useEffect(() => {
    const t1 = setInterval(() => setTick(p => p + 1), 1200)
    const t2 = setInterval(() => setMsgTick(p => p + 1), 2800)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const bars = [38, 45, 55, 50, 62, 68, 60, 74, 72, 81, 78, 90]
  const activeBar = tick % 12

  const customers = [
    { name: 'Ana Beatriz', service: 'Coloração', days: 42, stage: 'Em Risco', stageColor: 'text-amber-400', dot: 'bg-amber-400' },
    { name: 'Carla Mendes', service: 'Escova', days: 8, stage: 'Ativo', stageColor: 'text-emerald-400', dot: 'bg-emerald-400' },
    { name: 'Fernanda S.', service: 'Manicure', days: 71, stage: 'Perdido', stageColor: 'text-rose-400', dot: 'bg-rose-400' },
    { name: 'Juliana R.', service: 'Hidratação', days: 15, stage: 'VIP', stageColor: 'text-[#C9A14A]', dot: 'bg-[#C9A14A]' },
  ]

  const msgs = [
    '✅ "Ana, sentimos sua falta! Seu próximo retoque…"',
    '📨 "Carla, seu aniversário está chegando…"',
    '💫 "Fernanda, exclusivo para você: 20% off…"',
    '🌟 "Juliana, novidade VIP disponível!"',
  ]

  return (
    <AnimatedSection delay={0.25} direction="up" className="relative w-full max-w-5xl mx-auto mt-14 md:mt-20">
      {/* glow */}
      <div className="absolute -inset-6 rounded-3xl" style={{ background: 'radial-gradient(ellipse at 50% 100%,rgba(201,161,74,.12) 0%,transparent 65%)' }} />

      <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]" style={{ background: '#080808' }}>
          <div className="h-3 w-3 rounded-full bg-red-500/50" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
          <div className="h-3 w-3 rounded-full bg-green-500/50" />
          <div className="flex-1 flex justify-center">
            <div className="rounded-md px-8 py-1 text-[10px] text-white/20 border border-white/[0.04] flex items-center gap-1.5" style={{ background: '#141414' }}>
              <span className="text-emerald-500/60">🔒</span> retoquei.com/dashboard
            </div>
          </div>
        </div>

        <div className="flex" style={{ minHeight: 400 }}>
          {/* Sidebar */}
          <div className="hidden sm:flex w-[52px] flex-col items-center gap-3 py-4 border-r border-white/[0.04]" style={{ background: '#080808' }}>
            <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-1" style={{ background: 'rgba(201,161,74,.15)' }}>
              <Image src="/logo-mark.svg" alt="Q" width={18} height={18} />
            </div>
            {[
              { Icon: BarChart3, active: true },
              { Icon: Users, active: false },
              { Icon: Bot, active: false },
              { Icon: MessageSquare, active: false },
              { Icon: Target, active: false },
            ].map(({ Icon, active }, i) => (
              <div key={i} className="h-8 w-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: active ? 'rgba(201,161,74,.14)' : 'transparent', border: active ? '1px solid rgba(201,161,74,.22)' : '1px solid transparent' }}>
                <Icon className="h-3.5 w-3.5" style={{ color: active ? '#C9A14A' : 'rgba(255,255,255,.18)' }} />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 md:p-5 space-y-3 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-[9px] text-white/25 uppercase tracking-wider">Salão Aurora · Abril 2026</p>
                <p className="text-xs font-semibold text-white mt-0.5">Visão Geral</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 px-2.5 py-1 text-[9px] text-emerald-400" style={{ background: 'rgba(16,185,129,.08)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-flex" style={{ animation: 'pulse-dot 2s infinite' }} />
                4 clientes recuperados hoje
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Total', value: '1.847', delta: '+83', color: '#fff' },
                { label: 'Ativos', value: '1.204', delta: '+14%', color: '#10b981' },
                { label: 'Em Risco', value: '318', delta: '⚠ 17%', color: '#f59e0b' },
                { label: 'LTV Médio', value: 'R$912', delta: '+9%', color: '#C9A14A' },
              ].map((k) => (
                <div key={k.label} className="rounded-lg p-2.5 transition-all" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.05)' }}>
                  <p className="text-[8px] text-white/30 mb-1 uppercase tracking-wider">{k.label}</p>
                  <p className="text-sm font-bold" style={{ color: k.color }}>{k.value}</p>
                  <p className="text-[8px] text-white/25 mt-0.5">{k.delta}</p>
                </div>
              ))}
            </div>

            {/* Charts + Table row */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {/* Bar chart */}
              <div className="sm:col-span-2 rounded-lg p-3" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
                <p className="text-[8px] text-white/30 mb-2 uppercase tracking-wider">Evolução mensal</p>
                <div className="flex items-end gap-[3px] h-14">
                  {bars.map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all duration-700"
                      style={{
                        height: `${h}%`,
                        background: i === activeBar
                          ? 'linear-gradient(to top,#C9A14A,#F0C87A)'
                          : i < activeBar
                            ? 'rgba(201,161,74,.38)'
                            : 'rgba(255,255,255,.06)',
                      }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[7px] text-white/20">Jan</span>
                  <span className="text-[7px] text-white/20">Abr</span>
                </div>
              </div>

              {/* Customer mini-list */}
              <div className="sm:col-span-3 rounded-lg p-3" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
                <p className="text-[8px] text-white/30 mb-2 uppercase tracking-wider">Clientes · risco hoje</p>
                <div className="space-y-1.5">
                  {customers.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-all"
                      style={{ background: i === tick % 4 ? 'rgba(201,161,74,.06)' : 'transparent', border: `1px solid ${i === tick % 4 ? 'rgba(201,161,74,.15)' : 'transparent'}` }}>
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                      <span className="text-[9px] text-white/70 flex-1 font-medium truncate">{c.name}</span>
                      <span className="text-[8px] text-white/25 hidden sm:block">{c.service}</span>
                      <span className="text-[8px] text-white/25">{c.days}d</span>
                      <span className={`text-[8px] font-medium ${c.stageColor}`}>{c.stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp feed */}
            <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.04)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[8px] text-white/30 uppercase tracking-wider">Automações · enviando agora</p>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 1.5s infinite' }} />
                  <span className="text-[8px] text-emerald-400">ao vivo</span>
                </div>
              </div>
              <p className="text-[10px] text-white/50 transition-all" key={msgTick} style={{ animation: 'slide-in .4s ease' }}>
                {msgs[msgTick % msgs.length]}
              </p>
              <div className="flex gap-1 mt-2">
                {[68, 85, 91, 74].map((v, i) => (
                  <div key={i} className="flex-1 rounded-sm h-0.5" style={{ background: i <= msgTick % 4 ? '#C9A14A' : 'rgba(255,255,255,.08)' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

// ─── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, accent = false }: { icon: any; title: string; desc: string; accent?: boolean }) {
  return (
    <div className="card-hover rounded-2xl p-6 relative overflow-hidden group"
      style={{ background: accent ? 'linear-gradient(135deg,rgba(201,161,74,.1) 0%,rgba(201,161,74,.04) 100%)' : 'rgba(255,255,255,.025)', border: accent ? '1px solid rgba(201,161,74,.25)' : '1px solid rgba(255,255,255,.06)' }}>
      {accent && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at 0% 0%,rgba(201,161,74,.08) 0%,transparent 60%)' }} />}
      <div className="relative">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4" style={{ background: accent ? 'rgba(201,161,74,.2)' : 'rgba(255,255,255,.06)', border: accent ? '1px solid rgba(201,161,74,.3)' : '1px solid rgba(255,255,255,.08)' }}>
          <Icon className="h-5 w-5" style={{ color: accent ? '#C9A14A' : 'rgba(255,255,255,.6)' }} />
        </div>
        <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
        <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Step card ─────────────────────────────────────────────────────────────────
function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-[#C9A14A]"
        style={{ background: 'rgba(201,161,74,.12)', border: '1px solid rgba(201,161,74,.25)' }}>
        {n}
      </div>
      <div className="pt-1">
        <p className="text-sm font-semibold text-white mb-1">{title}</p>
        <p className="text-xs text-white/45 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── Pricing card ──────────────────────────────────────────────────────────────
function PricingCard({ name, price, desc, features, cta, highlighted }: {
  name: string; price: string; desc: string; features: string[]; cta: string; highlighted?: boolean
}) {
  return (
    <div className={`card-hover rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden ${highlighted ? 'ring-1 ring-[#C9A14A]/40' : ''}`}
      style={{ background: highlighted ? 'linear-gradient(145deg,rgba(201,161,74,.1),rgba(201,161,74,.04))' : 'rgba(255,255,255,.03)', border: highlighted ? '1px solid rgba(201,161,74,.3)' : '1px solid rgba(255,255,255,.06)' }}>
      {highlighted && (
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,#C9A14A,transparent)' }} />
      )}
      {highlighted && (
        <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-black" style={{ background: '#C9A14A' }}>
          Popular
        </span>
      )}
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{name}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">{price}</span>
          {price !== 'Grátis' && <span className="text-xs text-white/35">/mês</span>}
        </div>
        <p className="text-xs text-white/40 mt-1.5">{desc}</p>
      </div>
      <ul className="flex flex-col gap-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-white/60">
            <CheckCircle className="h-3.5 w-3.5 text-[#C9A14A] flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/register"
        className={`relative overflow-hidden w-full py-3 rounded-xl text-sm font-semibold text-center transition-all ${highlighted ? 'text-black gold-shimmer-btn' : 'text-white hover:text-[#C9A14A]'}`}
        style={{ background: highlighted ? 'linear-gradient(135deg,#C9A14A,#E8C06A)' : 'rgba(255,255,255,.05)', border: highlighted ? 'none' : '1px solid rgba(255,255,255,.08)' }}>
        {cta}
      </Link>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
      <button className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left" onClick={() => setOpen(v => !v)}>
        <span className="text-sm font-medium text-white/85">{q}</span>
        <ChevronDown className={`h-4 w-4 text-white/40 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div style={{ maxHeight: open ? 300 : 0, overflow: 'hidden', transition: 'max-height .35s cubic-bezier(.4,0,.2,1)' }}>
        <p className="px-5 pb-5 text-xs text-white/50 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', s, { passive: true })
    return () => window.removeEventListener('scroll', s)
  }, [])

  return (
    <div className="min-h-screen text-white" style={{ background: '#080808' }}>
      <G />
      <CursorGlow />

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
        style={{ background: scrolled ? 'rgba(8,8,8,.92)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,.05)' : '1px solid transparent' }}>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-mark.svg" alt="Q" width={28} height={28} className="flex-shrink-0" />
            <Image src="/logo-wordmark.svg" alt="Retoquei" width={120} height={32} className="flex-shrink-0" />
          </Link>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { href: '#como-funciona', label: 'Como funciona' },
              { href: '#recursos', label: 'Recursos' },
              { href: '#precos', label: 'Preços' },
              { href: '#faq', label: 'FAQ' },
            ].map(l => (
              <a key={l.href} href={l.href} className="nav-link text-sm">{l.label}</a>
            ))}
          </nav>

          {/* CTAs — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/55 hover:text-white transition-colors px-3 py-1.5">
              Entrar
            </Link>
            <Link href="/register"
              className="relative overflow-hidden gold-shimmer-btn text-sm font-semibold px-4 py-2 rounded-xl text-black transition-all hover:shadow-[0_0_20px_rgba(201,161,74,.35)]"
              style={{ background: 'linear-gradient(135deg,#C9A14A,#E8C06A)' }}>
              Começar grátis
            </Link>
          </div>

          {/* Mobile menu */}
          <MobileMenu />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 md:pt-36 pb-12 md:pb-20 px-4 sm:px-6 overflow-hidden">
        <Particles />

        {/* Background radials */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse,rgba(201,161,74,.08) 0%,transparent 65%)', filter: 'blur(40px)' }} />
        <div className="absolute top-20 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse,rgba(201,161,74,.05) 0%,transparent 60%)' }} />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Grupo Império badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-5"
            style={{ background: 'rgba(201,161,74,.1)', border: '1px solid rgba(201,161,74,.2)', color: '#C9A14A' }}>
            <Star className="h-3 w-3" />
            Uma empresa do Grupo Império
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white leading-tight mb-5 tracking-tight">
            Seu salão para de{' '}
            <span className="relative inline-block">
              <span style={{
                background: 'linear-gradient(135deg,#C9A14A 0%,#F0C87A 50%,#C9A14A 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient-x 4s ease infinite',
              }}>
                perder clientes
              </span>
            </span>
            <br className="hidden sm:block" /> e começa a recuperá-los.
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed mb-8 md:mb-10">
            Conecte seu sistema de agendamento, identifique clientes em risco e dispare
            mensagens personalizadas no WhatsApp — totalmente automático.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Link href="/register"
              className="relative overflow-hidden gold-shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-black transition-all hover:shadow-[0_0_28px_rgba(201,161,74,.4)] hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#C9A14A,#E8C06A)' }}>
              Começar gratuitamente
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#como-funciona"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,.1)' }}>
              Ver como funciona
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          <p className="text-xs text-white/25">Sem cartão de crédito · 14 dias grátis · Cancele quando quiser</p>

          {/* Dashboard */}
          <DashboardMockup />
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <AnimatedSection direction="up" className="py-12 md:py-16 px-4 sm:px-6 border-y border-white/[0.04]"
        style={{ background: 'rgba(255,255,255,.015)' } as any}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: 2800, suf: '+', label: 'Salões ativos', pre: '' },
            { n: 94, suf: '%', label: 'Taxa de entrega', pre: '' },
            { n: 3, suf: 'x', label: 'Mais retenção', pre: '' },
            { n: 2, suf: 'M+', label: 'Msgs enviadas', pre: '' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl md:text-3xl font-bold text-[#C9A14A] mb-1">
                {s.pre}<AnimatedCounter target={s.n} suffix={s.suf} />
              </p>
              <p className="text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── Como funciona ────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection direction="up" className="text-center mb-12 md:mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A14A] mb-3 block">Como funciona</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Configure em menos de 10 minutos</h2>
            <p className="text-sm text-white/45 max-w-xl mx-auto">Do zero ao primeiro WhatsApp automático enviado sem precisar tocar no código.</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <AnimatedSection direction="left" className="space-y-6">
              {[
                { n: '01', title: 'Conecte seu sistema de agendamento', desc: 'Importe via CSV, webhook ou integração direta com Trinks, Booksy e outros. Seus clientes entram automaticamente.' },
                { n: '02', title: 'A IA analisa cada cliente', desc: 'Calculamos LTV, frequência, risco de abandono e momento ideal de retorno. Tudo em tempo real.' },
                { n: '03', title: 'Automações disparam sozinhas', desc: 'WhatsApp personalizado enviado no momento certo — pós-visita, aniversário, risco, perda — sem ação manual.' },
                { n: '04', title: 'Acompanhe a recuperação', desc: 'Dashboard mostra clientes recuperados, receita gerada e taxa de entrega em tempo real.' },
              ].map(s => <StepCard key={s.n} {...s} />)}
            </AnimatedSection>

            <AnimatedSection direction="right" className="hidden md:block">
              <div className="rounded-2xl p-6 space-y-3" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,161,74,.15)', border: '1px solid rgba(201,161,74,.25)' }}>
                    <Bot className="h-4 w-4 text-[#C9A14A]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Automação ativa</p>
                    <p className="text-[10px] text-white/35">Pós-visita · enviando agora</p>
                  </div>
                  <span className="ml-auto text-[9px] font-medium px-2 py-0.5 rounded-full text-emerald-400" style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)' }}>
                    Live
                  </span>
                </div>
                {[
                  { client: 'Ana B.', msg: 'Obrigada pela visita, Ana! Já marcamos seu retoque para daqui 28 dias 💛', time: 'agora', status: '✓✓' },
                  { client: 'Paula M.', msg: 'Paula, sentimos sua falta! Que tal um retorno com 15% de desconto especial?', time: '3min', status: '✓✓' },
                  { client: 'Carla S.', msg: 'Feliz aniversário, Carla! 🎂 Um presente exclusivo te espera no salão.', time: '8min', status: '✓' },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-white/70">{m.client}</span>
                      <span className="text-[9px] text-white/25">{m.time} · {m.status}</span>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">{m.msg}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── Recursos ─────────────────────────────────────────────────────── */}
      <section id="recursos" className="py-16 md:py-24 px-4 sm:px-6" style={{ background: 'rgba(255,255,255,.012)' }}>
        <div className="max-w-5xl mx-auto">
          <AnimatedSection direction="up" className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A14A] mb-3 block">Recursos</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Tudo que seu salão precisa</h2>
            <p className="text-sm text-white/45 max-w-xl mx-auto">Uma plataforma completa de retenção, do CRM às mensagens automáticas.</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[
              { icon: Users, title: 'CRM de Clientes', desc: 'Perfil completo de cada cliente: histórico, LTV, serviços preferidos, profissional favorito e muito mais.', accent: true },
              { icon: AlertTriangle, title: 'Alertas de Risco', desc: 'Identificamos clientes prestes a abandonar antes que isso aconteça, com score de risco em tempo real.' },
              { icon: MessageSquare, title: 'WhatsApp Automático', desc: 'Mensagens personalizadas disparadas no momento certo — pós-visita, aniversário, risco, reativação.' },
              { icon: BarChart3, title: 'Dashboard Analítico', desc: 'Evolução mensal, taxa de retenção, LTV médio, receita recuperada e muito mais em um só lugar.' },
              { icon: Bot, title: 'Fluxos Inteligentes', desc: '7 automações pré-configuradas e prontas para usar. Crie fluxos personalizados sem código.' },
              { icon: Zap, title: 'Segmentação Avançada', desc: 'Segmentos dinâmicos por estágio de vida, frequência, ticket médio, aniversário e dezenas de critérios.' },
              { icon: CalendarCheck, title: 'Sync de Agendamentos', desc: 'Importação automática de todos os agendamentos. Suporte a CSV, webhook e integrações diretas.' },
              { icon: TrendingUp, title: 'Receita Recuperada', desc: 'Veja exatamente quanto dinheiro a plataforma trouxe de volta: cada cliente reativado rastreado.' },
              { icon: Phone, title: 'Templates Aprovados', desc: 'Biblioteca de templates prontos, aprovados pelo Meta. Personalize com nome, serviço e data.' },
            ].map((f, i) => (
              <AnimatedSection key={i} direction="up" delay={i * 0.05}>
                <FeatureCard {...f} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prova social ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection direction="up" className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">O que os salões dizem</h2>
            <p className="text-sm text-white/40">Resultados reais de quem já usa o Retoquei</p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { text: 'Em 2 semanas recuperamos 34 clientes que não vinham há meses. O WhatsApp automático mudou o jogo.', name: 'Mariana Costa', role: 'Salão Belle · São Paulo', rating: 5 },
              { text: 'Antes eu perdia clientes sem nem saber. Agora o Retoquei avisa quem está sumindo e manda mensagem automaticamente.', name: 'Carlos Andrade', role: 'Studio CA · Belo Horizonte', rating: 5 },
              { text: 'A integração com meu sistema de agenda foi instantânea. Em 10 minutos já estava funcionando.', name: 'Patrícia Lima', role: 'Espaço Patricia · Curitiba', rating: 5 },
            ].map((t, i) => (
              <AnimatedSection key={i} direction="up" delay={i * 0.1}>
                <div className="card-hover rounded-2xl p-5 flex flex-col gap-4 h-full"
                  style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-[#C9A14A] text-[#C9A14A]" />
                    ))}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-[10px] text-white/35">{t.role}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ───────────────────────────────────────────────────────── */}
      <section id="precos" className="py-16 md:py-24 px-4 sm:px-6" style={{ background: 'rgba(255,255,255,.012)' }}>
        <div className="max-w-5xl mx-auto">
          <AnimatedSection direction="up" className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A14A] mb-3 block">Preços</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Simples e sem surpresas</h2>
            <p className="text-sm text-white/45 max-w-xl mx-auto">14 dias grátis em qualquer plano. Sem cartão de crédito para começar.</p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
            <AnimatedSection direction="up" delay={0}>
              <PricingCard
                name="Starter"
                price="R$197"
                desc="Perfeito para começar"
                features={['Até 500 clientes', '3 automações ativas', '1.000 msgs/mês', 'CSV import', 'Suporte por e-mail']}
                cta="Começar grátis"
              />
            </AnimatedSection>
            <AnimatedSection direction="up" delay={0.1}>
              <PricingCard
                name="Growth"
                price="R$397"
                desc="Para salões em expansão"
                features={['Até 2.000 clientes', 'Automações ilimitadas', '5.000 msgs/mês', 'Webhook + CSV', 'Segmentação avançada', 'Suporte prioritário']}
                cta="Começar grátis"
                highlighted
              />
            </AnimatedSection>
            <AnimatedSection direction="up" delay={0.2}>
              <PricingCard
                name="Pro"
                price="R$697"
                desc="Para redes e franquias"
                features={['Clientes ilimitados', 'Automações ilimitadas', 'Msgs ilimitadas', 'Multi-unidade', 'API + webhooks', 'Gerente de sucesso']}
                cta="Falar com vendas"
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection direction="up" className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Perguntas frequentes</h2>
            <p className="text-sm text-white/40">Tudo que você precisa saber antes de começar</p>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={0.1} className="space-y-2">
            {[
              { q: 'O Retoquei substitui meu sistema de agendamento?', a: 'Não. O Retoquei se conecta ao seu sistema atual (Trinks, Booksy, CSV, etc.) e funciona como uma camada de retenção por cima. Você continua usando o mesmo sistema de agendamentos.' },
              { q: 'Como funciona o WhatsApp?', a: 'Usamos a API oficial do WhatsApp (Meta Cloud API). Seus clientes recebem mensagens do número do seu salão, com templates aprovados pelo Meta. Sem risco de bloqueio.' },
              { q: 'Meus dados ficam seguros?', a: 'Sim. Utilizamos infraestrutura enterprise com criptografia em repouso e em trânsito. Seus dados nunca são compartilhados com terceiros. Conformidade total com LGPD.' },
              { q: 'Quanto tempo leva para configurar?', a: 'A maioria dos salões está operacional em menos de 15 minutos. O assistente de onboarding guia você passo a passo: conexão, importação, WhatsApp e primeira automação.' },
              { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multas ou fidelidade. Você pode cancelar pelo painel a qualquer momento. Seus dados ficam disponíveis para exportação por 30 dias após o cancelamento.' },
              { q: 'O que é o Grupo Império?', a: 'O Grupo Império é um grupo empresarial brasileiro focado em tecnologia e inovação para o setor de serviços. O Retoquei é uma das empresas do portfólio, especializada em retenção de clientes para salões de beleza.' },
            ].map((f, i) => <FAQ key={i} {...f} />)}
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6">
        <AnimatedSection direction="up" className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(201,161,74,.12) 0%,rgba(201,161,74,.05) 50%,rgba(201,161,74,.1) 100%)', border: '1px solid rgba(201,161,74,.25)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(201,161,74,.15) 0%,transparent 60%)' }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
                style={{ background: 'rgba(201,161,74,.15)', border: '1px solid rgba(201,161,74,.3)', color: '#C9A14A' }}>
                <Sparkles className="h-3 w-3" />
                14 dias grátis · sem cartão
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Pare de perder clientes.<br />Comece a recuperá-los.
              </h2>
              <p className="text-sm text-white/50 mb-8 max-w-lg mx-auto leading-relaxed">
                Junte-se a mais de 2.800 salões que já usam o Retoquei para crescer com inteligência.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register"
                  className="relative overflow-hidden gold-shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-black transition-all hover:shadow-[0_0_32px_rgba(201,161,74,.5)] hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg,#C9A14A,#E8C06A)' }}>
                  Criar conta grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
                  style={{ border: '1px solid rgba(255,255,255,.1)' }}>
                  Falar com a equipe
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-2">
                <Image src="/logo-mark.svg" alt="Q" width={24} height={24} />
                <Image src="/logo-wordmark.svg" alt="Retoquei" width={100} height={24} />
              </Link>
              <p className="text-xs text-white/30">Uma empresa do Grupo Império</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-2">
              {[
                { href: '#como-funciona', label: 'Como funciona' },
                { href: '#recursos', label: 'Recursos' },
                { href: '#precos', label: 'Preços' },
                { href: '/login', label: 'Entrar' },
                { href: '/register', label: 'Cadastrar' },
                { href: '/contact', label: 'Contato' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="text-xs text-white/35 hover:text-white/70 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 border-t border-white/[0.04]">
            <p className="text-[11px] text-white/20">© 2026 Retoquei · Grupo Império. Todos os direitos reservados.</p>
            <p className="text-[11px] text-white/20">Feito com ♥ no Brasil</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
