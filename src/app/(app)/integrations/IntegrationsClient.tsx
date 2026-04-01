'use client'

import { useState } from 'react'
import { ConnectorCard } from '@/components/integrations/ConnectorCard'

interface Connector {
  id: string
  name: string
  type: 'CSV' | 'WEBHOOK' | 'TRINKS'
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR' | 'PENDING'
  lastSyncAt: string | null
}

interface Props {
  connectors: Connector[]
}

export function IntegrationsClient({ connectors: initialConnectors }: Props) {
  const [connectors, setConnectors] = useState(initialConnectors)
  const [syncing, setSyncing] = useState<string | null>(null)

  async function handleSync(id: string) {
    setSyncing(id)
    setConnectors((prev) =>
      prev.map((c) => c.id === id ? { ...c, status: 'SYNCING' } : c)
    )
    try {
      const res = await fetch(`/api/connectors/${id}/sync`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConnectors((prev) =>
        prev.map((c) => c.id === id ? { ...c, status: 'CONNECTED', lastSyncAt: new Date().toISOString() } : c)
      )
    } catch (e) {
      setConnectors((prev) =>
        prev.map((c) => c.id === id ? { ...c, status: 'ERROR' } : c)
      )
      alert((e as Error).message)
    } finally {
      setSyncing(null)
    }
  }

  function handleConfigure(id: string) {
    const connector = connectors.find((c) => c.id === id)
    if (connector?.type === 'CSV') {
      window.location.href = '/integrations/csv'
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {connectors.map((c) => (
        <ConnectorCard
          key={c.id}
          id={c.id}
          name={c.name}
          type={c.type}
          status={c.status}
          lastSyncAt={c.lastSyncAt ? new Date(c.lastSyncAt) : null}
          syncing={syncing === c.id}
          onSync={() => handleSync(c.id)}
          onConfigure={() => handleConfigure(c.id)}
        />
      ))}
    </div>
  )
}
