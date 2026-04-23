'use client'

import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CustomerEditorProps {
  customerId: string
  tags: string[]
  lifecycleStage: string
}

const LIFECYCLE_STAGES = [
  { value: 'NEW', label: 'Novo', color: 'bg-blue-400/15 text-blue-400' },
  { value: 'ACTIVE', label: 'Ativo', color: 'bg-emerald-400/15 text-emerald-400' },
  { value: 'RECURRING', label: 'Recorrente', color: 'bg-purple-400/15 text-purple-400' },
  { value: 'VIP', label: 'VIP', color: 'bg-[#C9A14A]/15 text-[#C9A14A]' },
  { value: 'AT_RISK', label: 'Em Risco', color: 'bg-orange-400/15 text-orange-400' },
  { value: 'LOST', label: 'Perdido', color: 'bg-red-400/15 text-red-400' },
  { value: 'DORMANT', label: 'Inativo', color: 'bg-gray-400/15 text-gray-400' },
]

export default function CustomerEditor({ customerId, tags: initialTags, lifecycleStage }: CustomerEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [newTag, setNewTag] = useState('')
  const [stage, setStage] = useState(lifecycleStage)
  const [loading, setLoading] = useState(false)
  const [stageLoading, setStageLoading] = useState(false)

  async function addTag() {
    if (!newTag.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: [newTag.trim()] }),
      })

      if (!res.ok) throw new Error('Failed to add tag')

      const data = await res.json()
      setTags(data.tags)
      setNewTag('')
      toast.success('Tag adicionada')
    } catch (error) {
      toast.error('Erro ao adicionar tag')
    } finally {
      setLoading(false)
    }
  }

  async function removeTag(tagToRemove: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: [tagToRemove] }),
      })

      if (!res.ok) throw new Error('Failed to remove tag')

      const data = await res.json()
      setTags(data.tags)
      toast.success('Tag removida')
    } catch (error) {
      toast.error('Erro ao remover tag')
    } finally {
      setLoading(false)
    }
  }

  async function updateStage(newStage: string) {
    setStageLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifecycleStage: newStage }),
      })

      if (!res.ok) throw new Error('Failed to update stage')

      setStage(newStage)
      toast.success('Estágio atualizado')
    } catch (error) {
      toast.error('Erro ao atualizar estágio')
    } finally {
      setStageLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Lifecycle Stage */}
      <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Estágio de Vida</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {LIFECYCLE_STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => updateStage(s.value)}
              disabled={stageLoading}
              className={`text-xs px-3 py-2 rounded-lg transition-all font-medium ${
                stage === s.value
                  ? s.color + ' border border-current'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              } disabled:opacity-50`}
            >
              {stageLoading && stage === s.value ? (
                <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
              ) : null}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Tags</h3>

        {/* Current Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-2 bg-[#C9A14A]/20 text-[#C9A14A] px-3 py-1 rounded-full text-xs font-medium"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  disabled={loading}
                  className="hover:text-[#C9A14A]/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Tag Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nova tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
          />
          <button
            onClick={addTag}
            disabled={loading || !newTag.trim()}
            className="bg-[#C9A14A] text-black font-medium px-4 py-2 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}
