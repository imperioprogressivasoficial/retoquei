'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, ArrowRight, Check, Star, BarChart3, Zap, Shield } from 'lucide-react'

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }

        .gold-gradient { background: linear-gradient(135deg, #C9A14A 0%, #E8C06A 50%, #9F7C34 100%); }
        .float-animation { animation: float 3s ease-in-out infinite; }
        .fade-in-up { animation: fadeInUp 0.8s ease-out; }
        .hero-bg { background: radial-gradient(ellipse at center, rgba(201,161,74,0.1) 0%, transparent 70%); }
      `}</style>

      {/* NAVBAR */}
      <header className={`fixed w-full z-50 transition-all ${scrolled ? 'bg-black/80 backdrop-blur border-b border-gold/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center whitespace-nowrap">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 gold-gradient rounded-lg flex items-center justify-center font-bold">R</div>
            <span className="hidden sm:block text-xl font-bold">Retoquei</span>
          </Link>

          <nav className="hidden lg:flex gap-12 flex-1 justify-center">
            {['Problema', 'Solução', 'Preços', 'Depoimentos'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-gray-300 hover:text-[#C9A14A] transition whitespace-nowrap">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex gap-4 flex-shrink-0">
            <Link href="/login" className="text-sm text-gray-300 hover:text-white whitespace-nowrap">Entrar</Link>
            <Link href="/register" className="gold-gradient px-6 py-2 rounded-lg font-semibold text-black text-sm whitespace-nowrap">Teste Grátis</Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden bg-black/95 border-t border-gold/10 p-6 space-y-4">
            {['Problema', 'Solução', 'Preços', 'Depoimentos'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="block text-gray-300 hover:text-[#C9A14A]">
                {item}
              </a>
            ))}
            <Link href="/register" className="block gold-gradient px-4 py-2 rounded text-center font-semibold text-black">Teste Grátis</Link>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 relative hero-bg overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute rounded-full gold-gradient blur-3xl opacity-20 float-animation"
              style={{
                width: Math.random() * 200 + 100,
                height: Math.random() * 200 + 100,
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: i * 0.2 + 's'
              }} />
          ))}
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10 fade-in-up">
          <div className="mb-6 inline-block border border-[#C9A14A] rounded-full px-4 py-2">
            <p className="text-sm text-[#C9A14A]">⭐ Uma empresa do Grupo Império</p>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Recupere Clientes Perdidos <span className="gold-gradient bg-clip-text text-transparent">Automaticamente</span>
          </h1>

          <p className="text-xl text-gray-400 mb-8 leading-relaxed">
            Retoquei identifica quando suas clientes estão sumindo e as traz de volta com mensagens WhatsApp personalizadas — totalmente automático. Aumente seu faturamento em até 40%.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register" className="gold-gradient px-8 py-4 rounded-lg font-semibold text-black text-lg hover:shadow-2xl transition flex items-center justify-center gap-2">
              Comece o Teste Grátis por 14 Dias <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border-2 border-[#C9A14A] text-[#C9A14A] px-8 py-4 rounded-lg font-semibold hover:bg-[#C9A14A]/10 transition">
              Ver Demo
            </button>
          </div>

          <p className="text-gray-500 text-sm">✓ Sem cartão de crédito • ✓ Sem compromisso • ✓ Suporte em português</p>
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="problema" className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Você Está Deixando Dinheiro Na Mesa</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '👻', title: 'Clientes Desaparecem', desc: '30% da sua base fica em risco e você não percebe. R$ 7-15 mil perdidos por ano.' },
              { icon: '⏱️', title: 'Sem Automação', desc: 'Você perde 3-5 horas/semana tentando fazer retenção manual. Resultado: apenas 10% de recuperação.' },
              { icon: '📊', title: 'Crescimento Travado', desc: 'Você gasta tudo em adquirir clientes novos, mas perde as antigas. Crescimento virou acidental.' }
            ].map((item, i) => (
              <div key={i} className="bg-gray-900 border border-[#C9A14A]/30 rounded-xl p-8 hover:border-[#C9A14A] transition">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section id="solução" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Como Retoquei Resolve</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Identifica', desc: 'Monitora clientes que não voltam há 30+ dias' },
              { num: '02', title: 'Personaliza', desc: 'Cria mensagens automáticas por perfil' },
              { num: '03', title: 'Recupera', desc: '45-55% voltam com a primeira mensagem' }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-[#C9A14A]/20 mb-4">{item.num}</div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-lg">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-r from-[#C9A14A]/10 to-transparent border border-[#C9A14A]/30 rounded-xl p-8 md:p-12">
            <div className="flex items-start gap-6">
              <BarChart3 className="w-12 h-12 text-[#C9A14A] flex-shrink-0 mt-2" />
              <div>
                <h3 className="text-2xl font-bold mb-3">Resultado Real</h3>
                <p className="text-gray-300 mb-4">Salões que usam Retoquei recuperam em média:</p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-[#C9A14A]">5-15</div>
                    <p className="text-gray-400">clientes/mês</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#C9A14A]">+12-40%</div>
                    <p className="text-gray-400">faturamento</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#C9A14A]">6-30x</div>
                    <p className="text-gray-400">ROI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section id="preços" className="py-20 px-6 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Escolha Seu Plano</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '97',
                desc: 'Para salões pequenos',
                features: ['Até 500 clientes', '1 usuário', 'WhatsApp ilimitado', 'Suporte email']
              },
              {
                name: 'Professional',
                price: '297',
                desc: 'Mais popular',
                popular: true,
                features: ['Até 2.000 clientes', '5 usuários', 'WhatsApp + automação', 'Prioridade 24h', 'Analytics avançado']
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                desc: 'Grandes redes',
                features: ['Clientes ilimitados', 'Usuários ilimitados', 'Integrações custom', 'Account manager dedicado']
              }
            ].map((plan, i) => (
              <div key={i} className={`rounded-xl p-8 transition ${plan.popular ? 'gold-gradient md:scale-110' : 'bg-gray-900 border border-gray-800'}`}>
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-black' : ''}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-black/70' : 'text-gray-400'}`}>{plan.desc}</p>

                <div className="mb-8">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-black' : 'text-[#C9A14A]'}`}>
                    R$ {plan.price}
                  </span>
                  {plan.price !== 'Custom' && <span className={plan.popular ? 'text-black/70' : 'text-gray-400'}>/mês</span>}
                </div>

                <button className={`w-full py-3 rounded-lg font-semibold mb-8 transition ${plan.popular ? 'bg-black text-white hover:bg-black/80' : 'border border-[#C9A14A] text-[#C9A14A] hover:bg-[#C9A14A]/10'}`}>
                  Começar
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className={`flex items-center gap-3 ${plan.popular ? 'text-black' : 'text-gray-300'}`}>
                      <Check className="w-5 h-5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-12">Todos os planos incluem garantia 30 dias (reembolso total).</p>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Confie em Quem Já Usa</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Mariana Silva', salon: 'Salão Beauty Gold', text: 'Recuperei 23 clientes no primeiro mês. Isso foi R$ 4.200 em receita que eu teria perdido. Retoquei pagou por si mesma em dias.', rating: 5 },
              { name: 'João Santos', salon: 'Studio Moderno', text: 'Antes, perdia clientes silenciosamente. Agora sou avisado e mando uma mensagem. Simples, automático, eficaz. 40% de aumento em retenção.', rating: 5 },
              { name: 'Ana Costa', salon: 'Grupo Beleza Brasil', text: 'Estávamos perdendo 30% dos clientes todo ano. Com Retoquei, conseguimos manter 70%. E o melhor: sem trabalho manual. Automático 100%.', rating: 5 }
            ].map((review, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-8 hover:border-[#C9A14A] transition">
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-[#C9A14A] text-[#C9A14A]" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{review.text}"</p>
                <div>
                  <p className="font-bold">{review.name}</p>
                  <p className="text-sm text-gray-500">{review.salon}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6 gold-gradient relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold text-black mb-6">Pronto Para Recuperar Seus Clientes?</h2>
          <p className="text-black/80 text-lg mb-8">Teste Retoquei por 14 dias. Grátis. Sem cartão de crédito.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-black text-white px-8 py-4 rounded-lg font-semibold hover:bg-black/80 transition">
              Comece Agora
            </Link>
            <button className="border-2 border-black text-black px-8 py-4 rounded-lg font-semibold hover:bg-black/10 transition">
              Agendar Demo
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-gray-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#C9A14A]">Features</a></li>
                <li><a href="#" className="hover:text-[#C9A14A]">Preços</a></li>
                <li><a href="#" className="hover:text-[#C9A14A]">Segurança</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#C9A14A]">Sobre</a></li>
                <li><a href="#" className="hover:text-[#C9A14A]">Blog</a></li>
                <li><a href="#" className="hover:text-[#C9A14A]">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#C9A14A]">Privacidade</a></li>
                <li><a href="#" className="hover:text-[#C9A14A]">Termos</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#C9A14A]">Ajuda</a></li>
                <li><a href="#" className="hover:text-[#C9A14A]">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© 2024 Retoquei. Todos os direitos reservados. Empresa do Grupo Império.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
