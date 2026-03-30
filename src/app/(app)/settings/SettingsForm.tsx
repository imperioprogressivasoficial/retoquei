'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'

interface Props {
  tenant: { id: string; name: string; slug: string }
}

export function SettingsForm({ tenant }: Props) {
  const [name, setName] = useState(tenant.name)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/tenants/' + tenant.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* General */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4">Geral</h2>
        <div className="rounded-xl border border-border bg-[#1E1E1E] p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Nome do Salão</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Slug</label>
            <input
              value={tenant.slug}
              disabled
              className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </section>

      {/* WhatsApp */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4">WhatsApp</h2>
        <div className="rounded-xl border border-border bg-[#1E1E1E] p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400">
              Configure as credenciais da Meta WhatsApp Cloud API ou use o modo sandbox para testes.
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Phone Number ID</label>
            <input
              placeholder="Configure em .env → WHATSAPP_PHONE_NUMBER_ID"
              disabled
              className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Modo Sandbox</label>
            <p className="text-xs text-muted-foreground mt-1">
              Quando <code className="bg-black/30 px-1 rounded">WHATSAPP_MOCK_MODE=true</code>,
              mensagens são logadas no console e não enviadas via API real.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
