import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { MessageSquare, FileSpreadsheet, ArrowRight, Wifi, WifiOff, ExternalLink } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import CopyWebhookUrl from './CopyWebhookUrl'
import { IntegrationsLoading } from './IntegrationsLoading'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Integrações' }

export default async function IntegrationsPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retoquei-tawny.vercel.app'
  const webhookTrinks = `${baseUrl}/api/webhooks/leads?salon_id=${salon.id}&source=trinks`

  return (
    <Suspense fallback={<IntegrationsLoading />}>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Integrações</h1>
          <p className="text-gray-400 mt-1">Conecte seu WhatsApp e importe seus clientes</p>
        </div>

        <div className="grid gap-6">
        {/* WhatsApp — Card principal grande */}
        <Link
          href="/integrations/whatsapp"
          className="group relative bg-white/[0.03] border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/40 transition-all hover:bg-white/[0.04]"
        >
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <MessageSquare className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold text-white">WhatsApp</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 font-medium">Canal principal</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Conecte seu número de WhatsApp para enviar campanhas e automações. Funciona via QR Code ou código de pareamento.
              </p>
              <div className="flex items-center gap-2 text-[#C9A14A] text-sm font-medium group-hover:gap-3 transition-all">
                Configurar conexão <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Link>

        {/* Grid 2 colunas: Trinks + CSV */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trinks */}
          <div className="bg-white/[0.03] border border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/30 transition-colors">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                <span className="text-orange-400 text-lg font-bold">T</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Trinks</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Importe clientes e agendamentos automaticamente do Trinks via webhook.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Como conectar</p>
                <ol className="space-y-1.5 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold shrink-0">1.</span>
                    Copie a URL abaixo
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold shrink-0">2.</span>
                    No Trinks, vá em Configurações → Integrações
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 font-bold shrink-0">3.</span>
                    Cole a URL no campo de webhook
                  </li>
                </ol>
              </div>

              <div className="bg-black/30 border border-white/[0.06] rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5 font-medium">Webhook URL</p>
                <CopyWebhookUrl url={webhookTrinks} />
              </div>
            </div>
          </div>

          {/* CSV / Planilha */}
          <Link
            href="/integrations/csv"
            className="group bg-white/[0.03] border border-indigo-500/20 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Planilha / CSV</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Importe sua base de clientes de qualquer sistema via arquivo CSV ou Excel.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">O que você pode importar</p>
                <div className="flex flex-wrap gap-2">
                  {['Nome', 'Telefone', 'E-mail', 'Última visita', 'Visitas', 'Total gasto'].map((field) => (
                    <span key={field} className="text-xs px-2 py-1 rounded-md bg-indigo-400/10 text-indigo-400">
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[#C9A14A] text-sm font-medium group-hover:gap-3 transition-all pt-2">
                Importar arquivo <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>
      </div>
    </Suspense>
  )
}
