'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// CSV Import Wizard — 5-step flow for importing customers/appointments
// ---------------------------------------------------------------------------

type ImportType = 'customers' | 'appointments' | 'services'
type WizardStep = 'upload' | 'mapping' | 'validate' | 'import' | 'summary'

const CUSTOMER_REQUIRED_FIELDS = ['customer.name', 'customer.phone']
const APPOINTMENT_REQUIRED_FIELDS = ['appointment.customerPhone', 'appointment.datetime']

const FIELD_LABELS: Record<string, string> = {
  'customer.name': 'Nome do cliente *',
  'customer.phone': 'Telefone *',
  'customer.email': 'E-mail',
  'customer.birthdate': 'Data de nascimento',
  'customer.notes': 'Observações',
  'customer.tags': 'Tags',
  'appointment.customerPhone': 'Telefone do cliente *',
  'appointment.datetime': 'Data e hora *',
  'appointment.serviceName': 'Nome do serviço',
  'appointment.totalValue': 'Valor total',
  'appointment.status': 'Status',
  'appointment.notes': 'Observações',
  'service.name': 'Nome do serviço *',
  'service.category': 'Categoria',
  'service.price': 'Preço',
}

interface CSVImportWizardProps {
  importType: ImportType
  connectorId: string
  onComplete?: (result: { created: number; updated: number; errors: string[] }) => void
}

interface ParsedCSV {
  columns: string[]
  rows: Record<string, string>[]
  preview: Record<string, string>[]
}

export function CSVImportWizard({ importType, connectorId, onComplete }: CSVImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload')
  const [dragging, setDragging] = useState(false)
  const [parsed, setParsed] = useState<ParsedCSV | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({}) // targetField → csvColumn
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null)

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const text = await file.text()
    const res = await fetch('/api/connectors/csv/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText: text, importType }),
    })
    const data = await res.json()
    setParsed(data)

    // Auto-map columns with matching names
    const auto: Record<string, string> = {}
    for (const col of data.columns) {
      const lower = col.toLowerCase()
      for (const field of Object.keys(FIELD_LABELS)) {
        const fieldPart = field.split('.')[1]
        if (lower.includes(fieldPart) || fieldPart.includes(lower.slice(0, 4))) {
          auto[field] = col
          break
        }
      }
    }
    setMappings(auto)
    setStep('mapping')
  }, [importType])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) handleFile(file)
  }, [handleFile])

  // ── Validate ──────────────────────────────────────────────────────────────

  const validateMappings = () => {
    const required = importType === 'customers' ? CUSTOMER_REQUIRED_FIELDS : APPOINTMENT_REQUIRED_FIELDS
    const missing = required.filter((f) => !mappings[f])
    if (missing.length > 0) {
      setValidationErrors(missing.map((f) => `Campo obrigatório não mapeado: ${FIELD_LABELS[f] ?? f}`))
      return false
    }
    setValidationErrors([])
    return true
  }

  // ── Import ────────────────────────────────────────────────────────────────

  const runImport = async () => {
    if (!parsed) return
    setImporting(true)
    setProgress(10)

    try {
      const columnMappings = Object.entries(mappings).map(([targetField, csvColumn]) => ({
        targetField,
        csvColumn,
        required: false,
      }))

      setProgress(30)

      const res = await fetch('/api/connectors/csv/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectorId, importType, rows: parsed.rows, columnMappings }),
      })

      setProgress(80)
      const data = await res.json()
      setProgress(100)
      setResult(data)
      setStep('summary')
      onComplete?.(data)
    } catch (err) {
      setValidationErrors([(err as Error).message])
    } finally {
      setImporting(false)
    }
  }

  // ── Render steps ──────────────────────────────────────────────────────────

  if (step === 'upload') return (
    <div
      className={cn(
        'rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer',
        dragging ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/40',
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById('csv-file-input')?.click()}
    >
      <input
        id="csv-file-input"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
      <p className="text-white font-medium">Arraste seu arquivo CSV aqui</p>
      <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
      <p className="text-xs text-muted-foreground mt-3">Suporta arquivos .csv com qualquer separador</p>
    </div>
  )

  if (step === 'mapping' && parsed) return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-white">Mapeie as colunas do seu CSV</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {parsed.rows.length} linhas detectadas · {parsed.columns.length} colunas
        </p>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {Object.entries(FIELD_LABELS)
          .filter(([field]) => field.startsWith(importType === 'customers' ? 'customer.' : importType === 'appointments' ? 'appointment.' : 'service.'))
          .map(([field, label]) => (
            <div key={field} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-xs text-muted-foreground">{label}</span>
              <select
                value={mappings[field] ?? ''}
                onChange={(e) => setMappings({ ...mappings, [field]: e.target.value })}
                className="flex-1 rounded-lg border border-border bg-[#161616] px-3 py-1.5 text-sm text-white focus:border-gold focus:outline-none"
              >
                <option value="">— não mapear —</option>
                {parsed.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          ))}
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          {validationErrors.map((e, i) => (
            <p key={i} className="text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-3 w-3 shrink-0" />{e}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={() => { if (validateMappings()) setStep('import') }}
        className="flex items-center gap-2 rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
      >
        Continuar <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )

  if (step === 'import') return (
    <div className="space-y-6 text-center py-6">
      {importing ? (
        <>
          <Loader2 className="mx-auto h-10 w-10 text-gold animate-spin" />
          <p className="text-white font-medium">Importando dados...</p>
          <div className="mx-auto max-w-xs rounded-full bg-border h-2">
            <div
              className="h-2 rounded-full bg-gold transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <FileText className="mx-auto h-10 w-10 text-gold" />
          <p className="text-white font-medium">Pronto para importar</p>
          <p className="text-sm text-muted-foreground">{parsed?.rows.length} linhas serão processadas</p>
          <button
            onClick={runImport}
            className="rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
          >
            Iniciar importação
          </button>
        </>
      )}
    </div>
  )

  if (step === 'summary' && result) return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-8 w-8 text-green-400" />
        <div>
          <p className="text-white font-semibold">Importação concluída!</p>
          <p className="text-xs text-muted-foreground">Os dados foram processados com sucesso</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{result.created}</p>
          <p className="text-xs text-muted-foreground">Criados</p>
        </div>
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{result.updated}</p>
          <p className="text-xs text-muted-foreground">Atualizados</p>
        </div>
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{result.errors.length}</p>
          <p className="text-xs text-muted-foreground">Erros</p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-lg bg-red-500/5 border border-red-500/20 p-3">
          {result.errors.slice(0, 10).map((e, i) => (
            <p key={i} className="text-xs text-red-400">{e}</p>
          ))}
          {result.errors.length > 10 && (
            <p className="text-xs text-muted-foreground">+ {result.errors.length - 10} outros erros</p>
          )}
        </div>
      )}
    </div>
  )

  return null
}
