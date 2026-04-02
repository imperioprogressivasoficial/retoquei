import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CSVImportWizardWrapper } from './CSVImportWizardWrapper'

export default async function CSVIntegrationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let tenantId: string | null = null
  let connectorId: string | null = null

  try {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { ownedTenants: { take: 1 } },
    })
    tenantId = dbUser?.ownedTenants[0]?.tenantId || null
  } catch (e) {
    console.error('[CSV] Error fetching tenant:', e)
  }

  if (!tenantId) redirect('/onboarding/1')

  try {
    let connector = await prisma.bookingConnector.findFirst({
      where: { tenantId, type: 'CSV' },
    })

    if (!connector) {
      connector = await prisma.bookingConnector.create({
        data: {
          tenantId,
          type: 'CSV',
          name: 'Importação CSV',
          status: 'CONNECTED',
        },
      })
    }
    connectorId = connector.id
  } catch (e) {
    console.error('[CSV] Error with connector:', e)
    // Create a temporary ID if DB fails
    connectorId = `temp-${Date.now()}`
  }

  return (
    <div>
      <TopBar title="Importação CSV" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Link href="/integrations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Voltar para Integrações
        </Link>

        <div>
          <h1 className="text-lg font-bold text-white">Importar via CSV</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Faça upload de uma planilha CSV com seus clientes e agendamentos
          </p>
        </div>

        {connectorId && <CSVImportWizardWrapper connectorId={connectorId} />}
      </div>
    </div>
  )
}
