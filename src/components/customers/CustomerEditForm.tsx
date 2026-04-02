'use client'

import { useState } from 'react'
import { Save, Loader2, AlertCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Customer Edit Form — with validation
// ---------------------------------------------------------------------------

interface CustomerEditFormProps {
  customer: {
    id: string
    fullName: string
    email?: string
    phoneE164: string
    birthdate?: string
    lifecycleStage: string
    riskLevel: string
    notes?: string
    tags: string[]
  }
  onSave: (data: any) => Promise<void>
  disabled?: boolean
}

export function CustomerEditForm({ customer, onSave, disabled }: CustomerEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: customer.fullName,
    email: customer.email || '',
    phoneE164: customer.phoneE164,
    birthdate: customer.birthdate ? customer.birthdate.split('T')[0] : '',
    lifecycleStage: customer.lifecycleStage,
    riskLevel: customer.riskLevel,
    notes: customer.notes || '',
    tags: customer.tags.join(', '),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (!formData.fullName.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!formData.phoneE164.trim()) {
        throw new Error('Telefone é obrigatório')
      }

      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      await onSave({
        ...formData,
        tags,
      })

      setIsOpen(false)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="px-4 py-2 rounded-lg border border-gold bg-gold/10 text-gold text-sm font-medium hover:bg-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Editar Cliente
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E1E] rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1E1E1E] border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Editar Cliente</h2>
          <button
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white/5 text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                name="phoneE164"
                value={formData.phoneE164}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white/5 text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white/5 text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
              />
            </div>

            {/* Birthdate */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Data de Nascimento
              </label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white/5 text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
              />
            </div>

            {/* Lifecycle Stage */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Estágio do Ciclo de Vida
              </label>
              <select
                name="lifecycleStage"
                value={formData.lifecycleStage}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white/5 text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
              >
                <option value="NEW">Novo</option>
                <option value="ACTIVE">Ativo</option>
                <option value="RECURRING">Recorrente</option>
                <option value="VIP">VIP</option>
                <option value="AT_RISK">Em Risco</option>
                <option value="LOST">Perdido</option>
                <option value="DORMANT">Inativo</option>
              </select>
            </div>

            {/* Risk Level */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Nível de Risco
              </label>
              <select
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white/5 text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
              >
                <option value="LOW">Baixo</option>
                <option value="MEDIUM">Médio</option>
                <option value="HIGH">Alto</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Notas
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white/5 text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50 resize-none"
              placeholder="Anotações internas sobre o cliente..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="VIP, Referência, Frequente..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-white/5 text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-border bg-white/5 text-muted-foreground hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-gold bg-gold/10 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
