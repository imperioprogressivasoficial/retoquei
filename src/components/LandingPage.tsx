import Link from 'next/link'
import RotatingSegment from '@/components/ui/RotatingSegment'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight text-white">Retoquei</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#C9A14A] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#b8903e] transition-colors"
          >
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#C9A14A]/10 border border-[#C9A14A]/30 text-[#C9A14A] text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A14A] animate-pulse" />
          Automação para&nbsp;<RotatingSegment />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
          Recupere clientes.{' '}
          <span className="text-[#C9A14A]">Aumente recorrência.</span>
          <br />
          Automatize no WhatsApp.
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mb-10">
          O Retoquei identifica clientes em risco, cria segmentos inteligentes e dispara campanhas
          personalizadas no WhatsApp — tudo automaticamente.
        </p>
        <Link
          href="/register"
          className="bg-[#C9A14A] text-black font-bold px-8 py-4 rounded-xl text-base hover:bg-[#b8903e] transition-colors shadow-lg shadow-[#C9A14A]/20"
        >
          Começar grátis
        </Link>
        <p className="mt-4 text-xs text-gray-400">Sem cartão de crédito · Grátis para sempre no plano básico</p>
      </section>

      {/* Como funciona */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Como funciona</h2>
          <p className="text-gray-400">Três passos para transformar sua retenção de clientes</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Conecte a base',
              desc: 'Importe seus clientes via CSV, integração com seu sistema de agendamento ou adicione manualmente.',
            },
            {
              step: '02',
              title: 'Classifique clientes',
              desc: 'O Retoquei analisa automaticamente o histórico de visitas e classifica cada cliente: Novo, Recorrente, VIP, Em risco ou Perdido.',
            },
            {
              step: '03',
              title: 'Dispare campanhas',
              desc: 'Configure automações ou envie campanhas manuais no WhatsApp com mensagens personalizadas para cada segmento.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative p-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:border-[#C9A14A]/40 transition-colors"
            >
              <span className="text-5xl font-black text-[#C9A14A]/20 leading-none">{item.step}</span>
              <h3 className="text-lg font-semibold mt-3 mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section className="px-6 py-20 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Resultados reais para seu negócio</h2>
            <p className="text-gray-400">Tudo que você precisa para reter e crescer</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '↩', title: 'Recuperação de clientes', desc: 'Identifique clientes que sumiram e envie mensagens automáticas de reativação no momento certo.' },
              { icon: '🔁', title: 'Retenção automatizada', desc: 'Configure fluxos de mensagens para clientes pós-visita, aniversariantes e clientes em risco.' },
              { icon: '📊', title: 'Inteligência da base', desc: 'Segmente sua base por frequência, ticket médio, serviço preferido e muito mais.' },
              { icon: '📈', title: 'Resultados reais', desc: 'Acompanhe métricas de conversão, retorno das campanhas e evolução do ticket médio.' },
            ].map((b) => (
              <div key={b.title} className="flex gap-5 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:border-[#C9A14A]/30 transition-colors">
                <span className="text-2xl shrink-0">{b.icon}</span>
                <div>
                  <h3 className="font-semibold mb-1">{b.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center text-center px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para recuperar seus clientes?</h2>
        <p className="text-gray-400 mb-8 max-w-md">
          Comece hoje mesmo. Em minutos você já tem sua base importada e suas primeiras automações rodando.
        </p>
        <Link href="/register" className="bg-[#C9A14A] text-black font-bold px-8 py-4 rounded-xl text-base hover:bg-[#b8903e] transition-colors">
          Criar conta grátis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-base font-bold text-white">Retoquei</span>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Retoquei. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
