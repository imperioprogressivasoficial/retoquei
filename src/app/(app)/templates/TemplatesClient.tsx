'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, X, Loader2, Trash2, Send } from 'lucide-react'

const VARIABLE_BADGE_COLORS: Record<string, string> = {
  '{{customer_name}}': 'text-blue-400 bg-blue-400/10',
  '{{first_name}}': 'text-blue-400 bg-blue-400/10',
  '{{salon_name}}': 'text-green-400 bg-green-400/10',
  '{{days_since_last_visit}}': 'text-amber-400 bg-amber-400/10',
  '{{preferred_service}}': 'text-purple-400 bg-purple-400/10',
}

const VARIABLES_HINT = [
  '{{customer_name}}', '{{first_name}}', '{{salon_name}}',
  '{{days_since_last_visit}}', '{{preferred_service}}',
  '{{last_visit_date}}', '{{predicted_return_date}}',
]

interface Template {
  id: string
  name: string
  body: string
  variables: string[]
  isSystem: boolean
  category?: string | null
}

interface Props {
  initialTemplates: Template[]
}

export function TemplatesClient({ initialTemplates }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Create/Edit form state
  const [formName, setFormName] = useState('')
  const [formBody, setFormBody] = useState('')

  // Test form state
  const [testPhone, setTestPhone] = useState('')
  const [testResult, setTestResult] = useState<{ rendered?: string; error?: string } | null>(null)

  function openCreate() {
    setFormName('')
    setFormBody('')
    setError('')
    setShowCreate(true)
    setEditingId(null)
  }

  function openEdit(tpl: Template) {
    setFormName(tpl.name)
    setFormBody(tpl.body)
    setError('')
    setEditingId(tpl.id)
    setShowCreate(false)
  }

  function openTest(id: string) {
    setTestingId(id)
    setTestPhone('')
    setTestResult(null)
  }

  async function handleCreate() {
    if (!formName.trim() || !formBody.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, body: formBody }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTemplates((prev) => [data, ...prev])
      setShowCreate(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit() {
    if (!editingId || !formName.trim() || !formBody.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/templates/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, body: formBody }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTemplates((prev) => prev.map((t) => t.id === editingId ? data : t))
      setEditingId(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este template?')) return
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  async function handleTest() {
    if (!testingId || !testPhone.trim()) return
    setLoading(true)
    setTestResult(null)
    try {
      const res = await fetch(`/api/templates/${testingId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTestResult({ rendered: data.rendered })
    } catch (e) {
      setTestResult({ error: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const activeModal = showCreate || editingId !== null || testingId !== null

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Novo Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-white">Nenhum template ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro template de mensagem</p>
          <button onClick={openCreate} className="mt-3 text-xs text-gold hover:underline">Criar template →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {templates.map((tpl) => {
            const vars = tpl.body.match(/\{\{[^}]+\}\}/g) ?? []
            return (
              <div key={tpl.id} className="rounded-xl border border-border bg-[#1E1E1E] p-5 hover:border-gold/20 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <h3 className="text-sm font-semibold text-white">{tpl.name}</h3>
                  </div>
                  {tpl.isSystem && (
                    <span className="text-xs bg-white/5 text-muted-foreground rounded px-1.5 py-0.5">Sistema</span>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-3 font-mono bg-black/20 rounded p-2">
                  {tpl.body}
                </p>
                {vars.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[...new Set(vars)].map((v) => (
                      <span key={v} className={`text-[10px] font-mono rounded px-1.5 py-0.5 ${VARIABLE_BADGE_COLORS[v] ?? 'text-muted-foreground bg-white/5'}`}>
                        {v}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  {!tpl.isSystem && (
                    <button onClick={() => openEdit(tpl)} className="text-xs text-muted-foreground hover:text-white transition-colors">
                      Editar
                    </button>
                  )}
                  <button onClick={() => openTest(tpl.id)} className="text-xs text-gold hover:underline flex items-center gap-1">
                    <Send className="h-3 w-3" /> Testar envio
                  </button>
                  {!tpl.isSystem && (
                    <button onClick={() => handleDelete(tpl.id)} className="ml-auto text-xs text-red-400/70 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setShowCreate(false); setEditingId(null); setTestingId(null) }}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-[#1E1E1E] p-6" onClick={(e) => e.stopPropagation()}>

            {/* Create / Edit Modal */}
            {(showCreate || editingId) && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white">{editingId ? 'Editar Template' : 'Novo Template'}</h2>
                  <button onClick={() => { setShowCreate(false); setEditingId(null) }} className="text-muted-foreground hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Nome do template</label>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: Lembrete de retorno"
                      className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Mensagem</label>
                    <textarea
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      rows={5}
                      placeholder="Olá {{first_name}}, faz {{days_since_last_visit}} dias desde sua última visita em {{salon_name}}..."
                      className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none resize-none font-mono"
                    />
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {VARIABLES_HINT.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormBody((prev) => prev + v)}
                          className="text-[10px] font-mono rounded px-1.5 py-0.5 text-muted-foreground bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    onClick={editingId ? handleEdit : handleCreate}
                    disabled={loading || !formName.trim() || !formBody.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Salvar' : 'Criar Template'}
                  </button>
                </div>
              </>
            )}

            {/* Test Modal */}
            {testingId && !showCreate && !editingId && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white">Testar Envio</h2>
                  <button onClick={() => setTestingId(null)} className="text-muted-foreground hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Número de telefone (com DDD e código do país)</label>
                    <input
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+5511999999999"
                      className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                    />
                  </div>
                  {testResult?.rendered && (
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                      <p className="text-xs text-green-400 font-medium mb-1.5">Mensagem enviada (modo mock):</p>
                      <p className="text-xs text-white font-mono whitespace-pre-wrap">{testResult.rendered}</p>
                    </div>
                  )}
                  {testResult?.error && <p className="text-xs text-red-400">{testResult.error}</p>}
                  <button
                    onClick={handleTest}
                    disabled={loading || !testPhone.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar Teste</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
