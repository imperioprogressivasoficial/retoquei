'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Zap, Calendar, Gift, RotateCcw, UserX, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  category: string
  content: string
}

const TRIGGERS = [
  {
    value: 'AT_RISK',
    label: 'Cliente em risco',
    desc: 'Dispara quando um cliente é classificado como "em risco" de perda.',
    icon: UserX,
    color: 'text-orange-400 bg-orange-400/10',
  },
  {
    value: 'BIRTHDAY',
    label: 'Aniversário',
    desc: 'Envia automaticamente no dia do aniversário do cliente.',
    icon: Gift,
    color: 'text-pink-400 bg-pink-400/10',
  },
  {
    value: 'POST_VISIT',
    label: 'Pós-visita',
    desc: 'Envia X dias após a última visita do cliente.',
    icon: Calendar,
    color: 'text-blue-400 bg-blue-400/10',
  },
  {
    value: 'WINBACK',
    label: 'Recuperação',
    desc: 'Tenta recuperar clientes que não voltam há muito tempo.',
    icon: RotateCcw,
    color: 'text-emerald-400 bg-emerald-400/10',
  },
  {
    value: 'MANUAL_RULE',
    label: 'Regra personalizada',
    desc: 'Configure condições personalizadas para disparo.',
    icon: Settings2,
    color: 'text-purple-400 bg-purple-400/10',
  },
]

export default function NewAutomationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])

  // Form state
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [delayDays, setDelayDays] = useState('')

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !triggerType) return
    setLoading(true)

    const rulesJson = delayDays ? { delayDays: parseInt(delayDays) } : null

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, triggerType, templateId: templateId || null, isActive, rulesJson }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Erro ao criar automação')
        setLoading(false)
        return
      }

      toast.success('Automação criada com sucesso!')
      router.push('/automations')
      router.refresh()
    } catch {
      toast.error('Erro ao criar automação')
      setLoading(false)
    }
  }

  const selectedTrigger = TRIGGERS.find((t) => t.value === triggerType)
  const selectedTemplate = templates.find((t) => t.id === templateId)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/automations" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nova automação</h1>
          <p className="text-gray-400 text-sm">Configure uma automação para enviar mensagens automaticamente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <label className="block text-sm font-medium text-white mb-2">Nome da automação *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex: Recuperar clientes em risco"
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
          />
        </div>

        {/* Gatilho */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <label className="block text-sm font-medium text-white mb-3">Quando disparar? *</label>
          <div className="space-y-2">
            {TRIGGERS.map((trigger) => {
              const Icon = trigger.icon
              const isSelected = triggerType === trigger.value
              return (
                <button
                  key={trigger.value}
                  type="button"
                  onClick={() => setTriggerType(trigger.value)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-[#C9A14A]/50 bg-[#C9A14A]/5'
                      : 'border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${trigger.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isSelected ? 'text-[#C9A14A]' : 'text-white'}`}>
                      {trigger.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{trigger.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                    isSelected ? 'border-[#C9A14A]' : 'border-gray-600'
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A14A]" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Delay (for POST_VISIT and WINBACK) */}
        {(triggerType === 'POST_VISIT' || triggerType === 'WINBACK') && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <label className="block text-sm font-medium text-white mb-2">
              {triggerType === 'POST_VISIT' ? 'Enviar quantos dias após a visita?' : 'Enviar após quantos dias sem retorno?'}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="365"
                value={delayDays}
                onChange={(e) => setDelayDays(e.target.value)}
                placeholder="Ex: 7"
                className="w-24 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm text-center focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
              />
              <span className="text-sm text-gray-400">dias</span>
            </div>
          </div>
        )}

        {/* Template */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <label className="block text-sm font-medium text-white mb-2">Mensagem (template)</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
          >
            <option value="" className="bg-[#1A1A1A]">Selecionar template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#1A1A1A]">
                {t.name}
              </option>
            ))}
          </select>

          {selectedTemplate && (
            <div className="mt-3 bg-[#005C4B]/10 border border-[#005C4B]/30 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Prévia da mensagem:</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedTemplate.content}</p>
            </div>
          )}

          {templates.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Nenhum template encontrado.{' '}
              <Link href="/templates/new" className="text-[#C9A14A] hover:underline">Criar template</Link>
            </p>
          )}
        </div>

        {/* Ativar */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Ativar imediatamente</p>
              <p className="text-xs text-gray-500 mt-0.5">A automação começará a enviar mensagens assim que for criada</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-[#C9A14A]' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !name || !triggerType}
            className="flex-1 bg-[#C9A14A] text-black font-semibold py-3 rounded-xl text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Criar automação
              </>
            )}
          </button>
          <Link
            href="/automations"
            className="px-6 py-3 text-sm text-gray-400 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
