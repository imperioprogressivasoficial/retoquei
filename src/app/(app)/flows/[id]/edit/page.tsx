'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown,
  Clock, MessageSquare, GitBranch, UserCog, CalendarCheck,
  Users, Cake, Play, Loader2, ToggleLeft, ToggleRight, GripVertical,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TriggerType = 'AFTER_APPOINTMENT' | 'SEGMENT_ENTER' | 'BIRTHDAY_MONTH' | 'DAYS_INACTIVE' | 'MANUAL'
type StepType = 'DELAY' | 'SEND_MESSAGE' | 'CONDITION' | 'UPDATE_CUSTOMER'

interface FlowStep {
  id?: string
  stepOrder: number
  type: StepType
  config: Record<string, unknown>
  _localId: string // for keying before save
}

interface Flow {
  id: string
  name: string
  description: string | null
  triggerType: TriggerType
  triggerConfig: Record<string, unknown>
  isActive: boolean
  runsCount: number
  steps: FlowStep[]
}

interface Template {
  id: string
  name: string
  body: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRIGGER_META: Record<TriggerType, { label: string; icon: React.ReactNode; color: string }> = {
  AFTER_APPOINTMENT: { label: 'Após agendamento concluído', icon: <CalendarCheck className="h-4 w-4" />, color: 'text-green-400' },
  SEGMENT_ENTER: { label: 'Ao entrar no segmento', icon: <Users className="h-4 w-4" />, color: 'text-blue-400' },
  BIRTHDAY_MONTH: { label: 'Mês de aniversário', icon: <Cake className="h-4 w-4" />, color: 'text-pink-400' },
  DAYS_INACTIVE: { label: 'Dias sem visita', icon: <Clock className="h-4 w-4" />, color: 'text-amber-400' },
  MANUAL: { label: 'Disparo manual', icon: <Play className="h-4 w-4" />, color: 'text-purple-400' },
}

const STEP_META: Record<StepType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  DELAY: { label: 'Aguardar', icon: <Clock className="h-3.5 w-3.5" />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  SEND_MESSAGE: { label: 'Enviar mensagem', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-green-400', bg: 'bg-green-400/10' },
  CONDITION: { label: 'Condição', icon: <GitBranch className="h-3.5 w-3.5" />, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  UPDATE_CUSTOMER: { label: 'Atualizar cliente', icon: <UserCog className="h-3.5 w-3.5" />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
}

function genId() {
  return Math.random().toString(36).slice(2)
}

function defaultStepConfig(type: StepType): Record<string, unknown> {
  switch (type) {
    case 'DELAY': return { unit: 'days', value: 1 }
    case 'SEND_MESSAGE': return { templateId: '', channel: 'WHATSAPP' }
    case 'CONDITION': return { field: 'lifecycle', operator: 'equals', value: '' }
    case 'UPDATE_CUSTOMER': return { field: 'whatsappOptIn', value: true }
  }
}

// ---------------------------------------------------------------------------
// Step config forms
// ---------------------------------------------------------------------------

function DelayConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <input
        type="number"
        min={1}
        value={(config.value as number) ?? 1}
        onChange={(e) => onChange({ ...config, value: parseInt(e.target.value) || 1 })}
        className="w-20 rounded-lg border border-border bg-[#161616] px-2 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
      />
      <select
        value={(config.unit as string) ?? 'days'}
        onChange={(e) => onChange({ ...config, unit: e.target.value })}
        className="rounded-lg border border-border bg-[#161616] px-2 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
      >
        <option value="hours">horas</option>
        <option value="days">dias</option>
      </select>
    </div>
  )
}

function SendMessageConfig({
  config, onChange, templates,
}: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; templates: Template[] }) {
  const selected = templates.find((t) => t.id === config.templateId)
  return (
    <div className="mt-3 space-y-2">
      <select
        value={(config.templateId as string) ?? ''}
        onChange={(e) => onChange({ ...config, templateId: e.target.value })}
        className="w-full rounded-lg border border-border bg-[#161616] px-2 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
      >
        <option value="">Selecione um template...</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      {selected && (
        <p className="text-[11px] text-muted-foreground font-mono bg-black/20 rounded p-2 line-clamp-2">
          {selected.body}
        </p>
      )}
    </div>
  )
}

function ConditionConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <select
        value={(config.field as string) ?? 'lifecycle'}
        onChange={(e) => onChange({ ...config, field: e.target.value })}
        className="rounded-lg border border-border bg-[#161616] px-2 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
      >
        <option value="lifecycle">Ciclo de vida</option>
        <option value="risk">Nível de risco</option>
        <option value="days_since_visit">Dias sem visita</option>
      </select>
      <select
        value={(config.operator as string) ?? 'equals'}
        onChange={(e) => onChange({ ...config, operator: e.target.value })}
        className="rounded-lg border border-border bg-[#161616] px-2 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
      >
        <option value="equals">igual a</option>
        <option value="gt">maior que</option>
        <option value="lt">menor que</option>
      </select>
      <input
        value={(config.value as string) ?? ''}
        onChange={(e) => onChange({ ...config, value: e.target.value })}
        placeholder="valor..."
        className="flex-1 min-w-[80px] rounded-lg border border-border bg-[#161616] px-2 py-1.5 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
      />
    </div>
  )
}

function UpdateCustomerConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <select
        value={(config.field as string) ?? 'whatsappOptIn'}
        onChange={(e) => onChange({ ...config, field: e.target.value })}
        className="rounded-lg border border-border bg-[#161616] px-2 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
      >
        <option value="whatsappOptIn">WhatsApp opt-in</option>
      </select>
      <select
        value={String(config.value ?? 'true')}
        onChange={(e) => onChange({ ...config, value: e.target.value === 'true' })}
        className="rounded-lg border border-border bg-[#161616] px-2 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
      >
        <option value="true">ativar</option>
        <option value="false">desativar</option>
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step card
// ---------------------------------------------------------------------------

function StepCard({
  step, index, total, templates,
  onDelete, onMoveUp, onMoveDown, onConfigChange,
}: {
  step: FlowStep
  index: number
  total: number
  templates: Template[]
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onConfigChange: (config: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const meta = STEP_META[step.type]

  function stepSummary() {
    switch (step.type) {
      case 'DELAY': return `${step.config.value ?? 1} ${step.config.unit === 'hours' ? 'hora(s)' : 'dia(s)'}`
      case 'SEND_MESSAGE': {
        const t = templates.find((x) => x.id === step.config.templateId)
        return t ? t.name : 'Nenhum template selecionado'
      }
      case 'CONDITION': return `${step.config.field} ${step.config.operator} ${step.config.value ?? '?'}`
      case 'UPDATE_CUSTOMER': return `${step.config.field} → ${step.config.value ? 'ativado' : 'desativado'}`
    }
  }

  return (
    <div className="rounded-xl border border-border bg-[#1E1E1E] overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
          {meta.icon}
          {meta.label}
        </div>
        <span className="text-xs text-muted-foreground flex-1 truncate">{stepSummary()}</span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded text-muted-foreground hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 rounded text-muted-foreground hover:text-white disabled:opacity-20 transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50">
          {step.type === 'DELAY' && <DelayConfig config={step.config} onChange={onConfigChange} />}
          {step.type === 'SEND_MESSAGE' && <SendMessageConfig config={step.config} onChange={onConfigChange} templates={templates} />}
          {step.type === 'CONDITION' && <ConditionConfig config={step.config} onChange={onConfigChange} />}
          {step.type === 'UPDATE_CUSTOMER' && <UpdateCustomerConfig config={step.config} onChange={onConfigChange} />}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add step button
// ---------------------------------------------------------------------------

function AddStepButton({ onAdd }: { onAdd: (type: StepType) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex justify-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white border border-dashed border-border hover:border-gold rounded-lg px-3 py-1.5 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar etapa
      </button>
      {open && (
        <div className="absolute top-9 z-20 w-52 rounded-xl border border-border bg-[#1E1E1E] p-1.5 shadow-xl" onMouseLeave={() => setOpen(false)}>
          {(Object.keys(STEP_META) as StepType[]).map((type) => {
            const m = STEP_META[type]
            return (
              <button
                key={type}
                onClick={() => { onAdd(type); setOpen(false) }}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors ${m.color}`}
              >
                {m.icon}
                <span className="text-white">{m.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function FlowEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [flow, setFlow] = useState<Flow | null>(null)
  const [steps, setSteps] = useState<FlowStep[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const fetchFlow = useCallback(async () => {
    try {
      const [flowRes, tplRes] = await Promise.all([
        fetch(`/api/flows/${id}`),
        fetch('/api/templates'),
      ])
      const flowData = await flowRes.json()
      const tplData = await tplRes.json()
      if (!flowRes.ok) throw new Error(flowData.error)
      setFlow(flowData)
      setSteps((flowData.steps ?? []).map((s: FlowStep) => ({ ...s, _localId: genId() })))
      setTemplates(Array.isArray(tplData) ? tplData : tplData.templates ?? [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchFlow() }, [fetchFlow])

  function addStep(type: StepType) {
    setSteps((prev) => [
      ...prev,
      { type, stepOrder: prev.length, config: defaultStepConfig(type), _localId: genId() },
    ])
  }

  function deleteStep(localId: string) {
    setSteps((prev) => prev.filter((s) => s._localId !== localId).map((s, i) => ({ ...s, stepOrder: i })))
  }

  function moveStep(localId: string, dir: -1 | 1) {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s._localId === localId)
      if (idx === -1) return prev
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((s, i) => ({ ...s, stepOrder: i }))
    })
  }

  function updateStepConfig(localId: string, config: Record<string, unknown>) {
    setSteps((prev) => prev.map((s) => s._localId === localId ? { ...s, config } : s))
  }

  async function handleSave() {
    if (!flow) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/flows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flow.name,
          description: flow.description,
          triggerType: flow.triggerType,
          triggerConfig: flow.triggerConfig,
          isActive: flow.isActive,
          steps: steps.map((s) => ({ type: s.type, stepOrder: s.stepOrder, config: s.config })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFlow(data)
      setSteps((data.steps ?? []).map((s: FlowStep) => ({ ...s, _localId: genId() })))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle() {
    if (!flow) return
    const res = await fetch(`/api/flows/${id}/toggle`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) setFlow((f) => f ? { ...f, isActive: data.isActive } : f)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        {error || 'Fluxo não encontrado.'}
      </div>
    )
  }

  const trigger = TRIGGER_META[flow.triggerType]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-[#0B0B0B]/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/flows')}
              className="text-muted-foreground hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">{flow.name}</h1>
              <p className="text-xs text-muted-foreground">{flow.runsCount} execuções</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggle}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${flow.isActive ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-white/5 text-muted-foreground hover:bg-green-500/10 hover:text-green-400'}`}
            >
              {flow.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
              {flow.isActive ? 'Ativo' : 'Inativo'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${saved ? 'bg-green-500/10 text-green-400' : 'bg-gold text-[#0B0B0B] hover:bg-gold/90'} disabled:opacity-50`}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Left panel — metadata */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-[#1E1E1E] p-5 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuração</h2>

            <div>
              <label className="text-xs text-muted-foreground">Nome do fluxo</label>
              <input
                value={flow.name}
                onChange={(e) => setFlow((f) => f ? { ...f, name: e.target.value } : f)}
                className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Descrição</label>
              <textarea
                value={flow.description ?? ''}
                onChange={(e) => setFlow((f) => f ? { ...f, description: e.target.value } : f)}
                rows={2}
                className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Gatilho</label>
              <select
                value={flow.triggerType}
                onChange={(e) => setFlow((f) => f ? { ...f, triggerType: e.target.value as TriggerType } : f)}
                className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
              >
                {(Object.keys(TRIGGER_META) as TriggerType[]).map((k) => (
                  <option key={k} value={k}>{TRIGGER_META[k].label}</option>
                ))}
              </select>
            </div>

            {/* Trigger config: DAYS_INACTIVE */}
            {flow.triggerType === 'DAYS_INACTIVE' && (
              <div>
                <label className="text-xs text-muted-foreground">Dias sem visita para acionar</label>
                <input
                  type="number"
                  min={1}
                  value={(flow.triggerConfig?.days as number) ?? 30}
                  onChange={(e) => setFlow((f) => f ? { ...f, triggerConfig: { ...f.triggerConfig, days: parseInt(e.target.value) || 30 } } : f)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Trigger preview */}
          <div className="rounded-xl border border-border bg-[#1E1E1E] p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Gatilho ativo</p>
            <div className={`flex items-center gap-2 text-sm font-medium ${trigger.color}`}>
              {trigger.icon}
              {trigger.label}
            </div>
          </div>
        </div>

        {/* Right panel — steps */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Etapas do fluxo ({steps.length})
          </h2>

          {steps.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma etapa. Adicione abaixo.</p>
            </div>
          )}

          {steps.map((step, idx) => (
            <div key={step._localId}>
              <StepCard
                step={step}
                index={idx}
                total={steps.length}
                templates={templates}
                onDelete={() => deleteStep(step._localId)}
                onMoveUp={() => moveStep(step._localId, -1)}
                onMoveDown={() => moveStep(step._localId, 1)}
                onConfigChange={(config) => updateStepConfig(step._localId, config)}
              />
              {/* Arrow connector */}
              {idx < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-px h-5 bg-border" />
                </div>
              )}
            </div>
          ))}

          <div className="pt-1">
            <AddStepButton onAdd={addStep} />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-3">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
