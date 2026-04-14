import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import CopyWebhookUrl from './CopyWebhookUrl'

export const metadata = { title: 'Integrações' }

interface Integration {
  name: string
  slug: string
  logo: string
  color: string
  description: string
  status: 'available' | 'coming_soon'
  type: 'lead_source' | 'channel' | 'import'
  href?: string
}

const INTEGRATIONS: Integration[] = [
  {
    name: 'WhatsApp',
    slug: 'whatsapp',
    logo: '/integrations/whatsapp.svg',
    color: 'border-emerald-500/30 hover:border-emerald-500/50',
    description: 'Conecte via QR Code para enviar e receber mensagens pelo WhatsApp.',
    status: 'available',
    type: 'channel',
    href: '/integrations/whatsapp',
  },
  {
    name: 'Trinks',
    slug: 'trinks',
    logo: '/integrations/trinks.svg',
    color: 'border-orange-500/30 hover:border-orange-500/50',
    description: 'Importe clientes e agendamentos automaticamente do Trinks via webhook.',
    status: 'available',
    type: 'lead_source',
  },
  {
    name: 'Salão 99',
    slug: 'salao99',
    logo: '/integrations/salao99.svg',
    color: 'border-pink-500/30 hover:border-pink-500/50',
    description: 'Receba leads do Salão 99 automaticamente via webhook.',
    status: 'available',
    type: 'lead_source',
  },
  {
    name: 'AgendZap',
    slug: 'agendzap',
    logo: '/integrations/agendzap.svg',
    color: 'border-green-500/30 hover:border-green-500/50',
    description: 'Sincronize agendamentos e clientes do AgendZap automaticamente.',
    status: 'available',
    type: 'lead_source',
  },
  {
    name: 'Importação CSV',
    slug: 'csv',
    logo: '/integrations/csv.svg',
    color: 'border-indigo-500/30 hover:border-indigo-500/50',
    description: 'Importe sua base de clientes via arquivo CSV.',
    status: 'available',
    type: 'import',
    href: '/integrations/csv',
  },
  {
    name: 'Webhook Personalizado',
    slug: 'webhook',
    logo: '/integrations/webhook.svg',
    color: 'border-purple-500/30 hover:border-purple-500/50',
    description: 'Integre qualquer sistema via webhook HTTP. Envie leads para o Retoquei.',
    status: 'available',
    type: 'lead_source',
  },
]

export default async function IntegrationsPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retoquei-tawny.vercel.app'
  const webhookBase = `${baseUrl}/api/webhooks/leads?salon_id=${salon.id}`

  const leadSources = INTEGRATIONS.filter((i) => i.type === 'lead_source')
  const channels = INTEGRATIONS.filter((i) => i.type === 'channel')
  const imports = INTEGRATIONS.filter((i) => i.type === 'import')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Integrações</h1>
        <p className="text-gray-400 mt-1">Conecte fontes de leads e canais de mensagem</p>
      </div>

      {/* Channels */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Canais de mensagem</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {channels.map((item) => (
            <Link
              key={item.slug}
              href={item.href || '#'}
              className={`bg-white/[0.03] border ${item.color} rounded-xl p-5 transition-colors block`}
            >
              <div className="flex items-center gap-4 mb-3">
                <Image src={item.logo} alt={item.name} width={96} height={32} className="rounded" />
              </div>
              <p className="text-sm text-gray-400">{item.description}</p>
              <span className="inline-flex items-center gap-1 text-xs text-[#C9A14A] font-medium mt-3">
                Configurar <ExternalLink className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Lead Sources */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Fontes de Leads</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leadSources.map((item) => (
            <div
              key={item.slug}
              className={`bg-white/[0.03] border ${item.color} rounded-xl p-5 transition-colors`}
            >
              <div className="flex items-center gap-4 mb-3">
                <Image src={item.logo} alt={item.name} width={96} height={32} className="rounded" />
                {item.status === 'available' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400">Disponível</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4">{item.description}</p>
              <div className="bg-black/30 border border-white/[0.06] rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Webhook URL</p>
                <CopyWebhookUrl url={`${webhookBase}&source=${item.slug}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Import */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Importação manual</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {imports.map((item) => (
            <Link
              key={item.slug}
              href={item.href || '#'}
              className={`bg-white/[0.03] border ${item.color} rounded-xl p-5 transition-colors block`}
            >
              <div className="flex items-center gap-4 mb-3">
                <Image src={item.logo} alt={item.name} width={96} height={32} className="rounded" />
              </div>
              <p className="text-sm text-gray-400">{item.description}</p>
              <span className="inline-flex items-center gap-1 text-xs text-[#C9A14A] font-medium mt-3">
                Importar <ExternalLink className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Webhook Docs */}
      <section className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-3">Como conectar via Webhook</h2>
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            1. Copie a URL do webhook da plataforma desejada acima.
          </p>
          <p>
            2. No painel do <strong className="text-white">Trinks</strong>, <strong className="text-white">Salão 99</strong> ou <strong className="text-white">AgendZap</strong>, vá em configurações e cole a URL no campo de webhook/integração.
          </p>
          <p>
            3. A cada novo agendamento ou cadastro de cliente, o lead será importado automaticamente para o Retoquei.
          </p>
          <div className="bg-black/30 border border-white/[0.06] rounded-lg p-4 mt-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Formato do JSON aceito</p>
            <pre className="text-xs text-emerald-400 overflow-x-auto">{`{
  "name": "Maria Silva",
  "phone": "11987654321",
  "email": "maria@email.com",
  "source": "trinks",
  "notes": "Corte + Escova"
}`}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}
