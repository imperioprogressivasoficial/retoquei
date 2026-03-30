'use client'

import { useState } from 'react'
import { CSVImportWizard } from '@/components/integrations/CSVImportWizard'
import { useRouter } from 'next/navigation'

interface Props { connectorId: string }

export function CSVImportWizardWrapper({ connectorId }: Props) {
  const [importType, setImportType] = useState<'customers' | 'appointments' | 'services'>('customers')
  const router = useRouter()

  return (
    <div className="space-y-5">
      {/* Type selector */}
      <div className="flex gap-2">
        {(['customers', 'appointments', 'services'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setImportType(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              importType === t
                ? 'bg-gold text-[#0B0B0B]'
                : 'bg-white/5 text-muted-foreground hover:text-white'
            }`}
          >
            {t === 'customers' ? 'Clientes' : t === 'appointments' ? 'Agendamentos' : 'Serviços'}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-[#1E1E1E] p-5">
        <CSVImportWizard
          importType={importType}
          connectorId={connectorId}
          onComplete={() => {
            setTimeout(() => router.push('/app/customers'), 1500)
          }}
        />
      </div>
    </div>
  )
}
