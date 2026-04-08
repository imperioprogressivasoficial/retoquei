import { redirect } from 'next/navigation'
import { Plug, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Integrações' }

const STATUS_ICONS = {
  CONNECTED: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  DISCONNECTED: <XCircle className="h-4 w-4 text-red-400" />,
  PENDING: <Clock className="h-4 w-4 text-[#C9A14A]" />,
  ERROR: <XCircle className="h-4 w-4 text-red-400" />,
}

const STATUS_LABELS: Record<string, string> = {
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
  PENDING: 'Pendente',
  ERROR: 'Erro',
}

const AVAILABLE = [
  { type: 'WHATSAPP_UNOFFICIAL', name: '📱 WhatsApp via QR Code', desc: 'Conecte seu número via QR Code (igual WhatsApp Web). Grátis com Evolution API.', href: '/integrations/whatsapp', highlight: true },
  { type: 'CSV', name: 'Importação CSV', desc: 'Importe sua base de clientes via arquivo CSV.', href: '/integrations/csv' },
  { type: 'WHATSAPP_OFFICIAL', name: 'WhatsApp Oficial (API)', desc: 'Conecte via WhatsApp Business API para envios em escala.', href: '#' },
  { type: 'WEBHOOK', name: 'Webhook', desc: 'Receba dados do seu sistema via webhook HTTP.', href: '#' },
  { type: 'API', name: 'API REST', desc: 'Integre qualquer sistema via nossa API REST.', href: '#' },
]

export default async function IntegrationsPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const integrations = await prisma.integration.findMany({
    where: { salonId: salon.id },
    orderBy: { createdAt: 'desc' },
  })

  const connectedTypes = new Set(integrations.filter((i) => i.status === 'CONNECTED').map((i) => i.type))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Integrações</h1>
        <p className="text-gray-400 mt-1">Conecte sua base de dados e canais de mensagem</p>
      </div>

      {integrations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Integrações ativas</h2>
          <div className="space-y-2">
            {integrations.map((i) => (
              <div key={i.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <div>
                  <p className="font-medium text-white text-sm">{i.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{i.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  {STATUS_ICONS[i.status as keyof typeof STATUS_ICONS]}
                  <span className="text-xs text-gray-400">{STATUS_LABELS[i.status] ?? i.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-gray-300 mb-3">Disponíveis</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {AVAILABLE.map((item) => {
          const isConnected = connectedTypes.has(item.type as never)
          return (
            <div key={item.type} className={`bg-white/[0.03] border rounded-xl p-5 transition-colors ${isConnected ? 'border-emerald-500/30' : 'border-white/[0.08] hover:border-[#C9A14A]/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{item.name}</h3>
                {isConnected && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-400/15 text-emerald-400">Conectado</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4">{item.desc}</p>
              {!isConnected && item.href !== '#' && (
                <a
                  href={item.href}
                  className="text-sm text-[#C9A14A] hover:underline font-medium"
                >
                  Configurar →
                </a>
              )}
              {!isConnected && item.href === '#' && (
                <span className="text-xs text-gray-600">Em breve</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Plug className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-400">Importar via CSV</span>
        </div>
        <p className="text-xs text-gray-600">
          Você pode importar clientes via CSV a qualquer momento. Acesse{' '}
          <a href="/integrations/csv" className="text-[#C9A14A] hover:underline">Importação CSV</a>.
        </p>
      </div>
    </div>
  )
}
