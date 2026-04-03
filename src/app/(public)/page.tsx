'use client'

import Link from 'next/link'
import { ArrowRight, Check, Star, MessageCircle, TrendingUp, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* HERO */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-[#C9A14A]/40 rounded-full px-4 py-1.5 mb-8 text-sm text-[#C9A14A]">
            ⭐ Plataforma de retenção para salões de beleza
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Recupere clientes perdidos{' '}
            <span className="text-[#C9A14A]">automaticamente</span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Retoquei identifica clientes que somem e os traz de volta com mensagens personalizadas pelo WhatsApp. Totalmente automático.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#C9A14A] text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-[#E8C06A] transition-colors"
            >
              Começar grátis por 14 dias <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:border-white/40 transition-colors"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="text-gray-500 text-sm">
            Sem cartão de crédito &nbsp;•&nbsp; Sem compromisso &nbsp;•&nbsp; Suporte em português
          </p>
        </div>
      </section>

      {/* NÚMEROS */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-[#C9A14A] mb-1">45%</div>
            <div className="text-gray-400 text-sm">dos clientes retornam na 1ª mensagem</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#C9A14A] mb-1">+30%</div>
            <div className="text-gray-400 text-sm">de aumento médio no faturamento</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[#C9A14A] mb-1">6x</div>
            <div className="text-gray-400 text-sm">retorno sobre investimento</div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Como funciona</h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
            Três etapas simples. Você configura uma vez e o sistema trabalha por você.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="w-12 h-12 bg-[#C9A14A]/20 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-[#C9A14A]" />
              </div>
              <div className="text-[#C9A14A] font-bold text-sm mb-2">PASSO 1</div>
              <h3 className="text-xl font-bold mb-3">Identifica</h3>
              <p className="text-gray-400 leading-relaxed">
                O sistema monitora automaticamente quais clientes não voltaram há 30, 60 ou 90 dias.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="w-12 h-12 bg-[#C9A14A]/20 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-[#C9A14A]" />
              </div>
              <div className="text-[#C9A14A] font-bold text-sm mb-2">PASSO 2</div>
              <h3 className="text-xl font-bold mb-3">Envia</h3>
              <p className="text-gray-400 leading-relaxed">
                Mensagens personalizadas são enviadas pelo WhatsApp no momento certo, com o nome da cliente.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="w-12 h-12 bg-[#C9A14A]/20 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-[#C9A14A]" />
              </div>
              <div className="text-[#C9A14A] font-bold text-sm mb-2">PASSO 3</div>
              <h3 className="text-xl font-bold mb-3">Recupera</h3>
              <p className="text-gray-400 leading-relaxed">
                Clientes retornam e você acompanha tudo no dashboard com métricas em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Planos simples</h2>
          <p className="text-gray-400 text-center mb-16">Comece grátis. Cancele quando quiser.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: 'R$ 97',
                period: '/mês',
                desc: 'Para salões pequenos',
                features: ['Até 500 clientes', '1 usuário', 'WhatsApp automático', 'Suporte por e-mail'],
                cta: 'Começar',
                highlight: false,
              },
              {
                name: 'Professional',
                price: 'R$ 297',
                period: '/mês',
                desc: 'Mais popular',
                features: ['Até 2.000 clientes', '5 usuários', 'WhatsApp + campanhas', 'Suporte prioritário 24h', 'Analytics avançado'],
                cta: 'Começar',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                desc: 'Redes e franquias',
                features: ['Clientes ilimitados', 'Usuários ilimitados', 'Integrações customizadas', 'Gerente dedicado'],
                cta: 'Falar com vendas',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? 'bg-[#C9A14A] text-black'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="mb-6">
                  <p className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-black/60' : 'text-[#C9A14A]'}`}>
                    {plan.desc}
                  </p>
                  <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className={`mb-1 ${plan.highlight ? 'text-black/60' : 'text-gray-400'}`}>{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`w-full py-3 rounded-xl font-semibold text-center transition-colors ${
                    plan.highlight
                      ? 'bg-black text-white hover:bg-black/80'
                      : 'border border-[#C9A14A] text-[#C9A14A] hover:bg-[#C9A14A]/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            Todos os planos incluem garantia de 30 dias com reembolso total.
          </p>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">O que dizem nossos clientes</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Mariana Silva',
                salon: 'Salão Beauty Gold',
                text: 'Recuperei 23 clientes no primeiro mês. Foram mais de R$ 4.000 em receita que eu teria perdido.',
              },
              {
                name: 'João Santos',
                salon: 'Studio Moderno',
                text: 'Antes perdia clientes sem perceber. Agora sou avisado automaticamente e a retenção aumentou 40%.',
              },
              {
                name: 'Ana Costa',
                salon: 'Grupo Beleza Brasil',
                text: 'Conseguimos manter 70% das clientes. Totalmente automático, sem trabalho manual nenhum.',
              },
            ].map((r) => (
              <div key={r.name} className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-[#C9A14A] text-[#C9A14A]" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{r.text}"</p>
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm text-gray-500">{r.salon}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comece a recuperar clientes hoje
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            14 dias grátis. Sem cartão de crédito. Sem burocracia.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#C9A14A] text-black font-bold px-10 py-4 rounded-xl text-lg hover:bg-[#E8C06A] transition-colors"
          >
            Criar conta grátis <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2024 Retoquei. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
