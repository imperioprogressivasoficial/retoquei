'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// CSV Import Wizard — upload direto ao Supabase Storage
// ---------------------------------------------------------------------------

type ImportType = 'customers' | 'appointments' | 'services'
type WizardStep = 'upload' | 'mapping' | 'import' | 'summary'

const CUSTOMER_REQUIRED_FIELDS = ['customer.name', 'customer.phone']
const APPOINTMENT_REQUIRED_FIELDS = ['appointment.customerPhone', 'appointment.datetime']

const FIELD_LABELS: Record<string, string> = {
  'customer.name': 'Nome do cliente *',
  'customer.phone': 'Telefone *',
  'customer.email': 'E-mail',
  'customer.birthdate': 'Data de nascimento',
  'customer.notes': 'Observações',
  'customer.tags': 'Tags',
  'customer.externalId': 'ID externo',
  'appointment.customerPhone': 'Telefone do cliente *',
  'appointment.datetime': 'Data e hora *',
  'appointment.serviceName': 'Nome do serviço',
  'appointment.totalValue': 'Valor total',
  'appointment.status': 'Status',
  'appointment.notes': 'Observações',
  'appointment.externalId': 'ID externo',
  'service.name': 'Nome do serviço *',
  'service.category': 'Categoria',
  'service.price': 'Preço',
  'service.externalId': 'ID externo',
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
  rowCount: number
  storagePath: string
}

export function CSVImportWizard({ importType, connectorId, onComplete }: CSVImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload')
  const [dragging, setDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parsed, setParsed] = useState<ParsedCSV | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null)

  // ── File upload via Supabase Storage ──────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null)
    setUploading(true)
    setUploadProgress(5)

    // Validate file
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setUploadError('Por favor, selecione um arquivo .csv')
      setUploading(false)
      return
    }
    if (file.size > 52_428_800) {
      setUploadError('Arquivo muito grande. O limite é 50 MB.')
      setUploading(false)
      return
    }
    if (file.size === 0) {
      setUploadError('O arquivo está vazio.')
      setUploading(false)
      return
    }

    try {
      // Step 1: Get signed upload URL from our API
      setUploadProgress(15)
      const urlRes = await fetch('/api/connectors/csv/storage-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      })

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({ error: 'Erro ao preparar upload' }))
        throw new Error(err.error ?? 'Erro ao preparar upload')
      }

      const { signedUrl, storagePath } = await urlRes.json()
      setUploadProgress(30)

      // Step 2: Upload file DIRECTLY to Supabase Storage (bypasses Vercel size limits)
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/csv' },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error(`Falha no upload: ${uploadRes.statusText}`)
      }
      setUploadProgress(65)

      // Step 3: Ask API to parse the file (reads from Storage server-side)
      const parseRes = await fetch('/api/connectors/csv/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath, importType }),
      })

      if (!parseRes.ok) {
        const err = await parseRes.json().catch(() => ({ error: 'Erro ao processar arquivo' }))
        throw new Error(err.error ?? 'Erro ao processar arquivo')
      }

      setUploadProgress(100)
      const data: ParsedCSV = await parseRes.json()

      if (!data.columns || data.columns.length === 0) {
        throw new Error('Nenhuma coluna detectada. Verifique se o arquivo é um CSV válido com cabeçalho na primeira linha.')
      }

      setParsed(data)

      // Auto-map columns with matching names
      const auto: Record<string, string> = {}
      for (const col of data.columns) {
        const lower = col.toLowerCase().replace(/[_\s-]/g, '')
        for (const field of Object.keys(FIELD_LABELS)) {
          const fieldPart = field.split('.')[1].toLowerCase()
          if (
            lower === fieldPart ||
            lower.includes(fieldPart) ||
            fieldPart.includes(lower) ||
            // common PT-BR column name matches
            (fieldPart === 'name' && (lower.includes('nome') || lower.includes('cliente'))) ||
            (fieldPart === 'phone' && (lower.includes('tel') || lower.includes('fone') || lower.includes('celular') || lower.includes('whatsapp'))) ||
            (fieldPart === 'email' && lower.includes('email')) ||
            (fieldPart === 'birthdate' && (lower.includes('nasc') || lower.includes('anivers'))) ||
            (fieldPart === 'totalvalue' && (lower.includes('valor') || lower.includes('preco') || lower.includes('preço'))) ||
            (fieldPart === 'datetime' && (lower.includes('data') || lower.includes('hora') || lower.includes('agend')))
          ) {
            if (!auto[field]) auto[field] = col
            break
          }
        }
      }
      setMappings(auto)
      setStep('mapping')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao fazer upload'
      setUploadError(msg)
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }, [importType])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ── Validate mappings ─────────────────────────────────────────────────────

  const validateMappings = () => {
    const required =
      importType === 'customers' ? CUSTOMER_REQUIRED_FIELDS :
      importType === 'appointments' ? APPOINTMENT_REQUIRED_FIELDS : []
    const missing = required.filter((f) => !mappings[f])
    if (missing.length > 0) {
      setValidationErrors(missing.map((f) => `Campo obrigatório não mapeado: ${FIELD_LABELS[f] ?? f}`))
      return false
    }
    setValidationErrors([])
    return true
  }

  // ── Run import ────────────────────────────────────────────────────────────

  const runImport = async () => {
    if (!parsed) return
    setImporting(true)
    setImportProgress(10)

    try {
      const columnMappings = Object.entries(mappings)
        .filter(([, col]) => col)
        .map(([targetField, csvColumn]) => ({
          targetField,
          csvColumn,
          required: false,
        }))

      setImportProgress(30)

      const res = await fetch('/api/connectors/csv/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectorId,
          importType,
          rows: parsed.rows,
          columnMappings,
          storagePath: parsed.storagePath,
        }),
      })

      setImportProgress(80)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro ao importar' }))
        throw new Error(err.error ?? 'Erro ao importar')
      }

      const data = await res.json()
      setImportProgress(100)
      setResult(data)
      setStep('summary')
      onComplete?.(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar dados'
      setValidationErrors([msg])
      setImporting(false)
      setImportProgress(0)
    } finally {
      setImporting(false)
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = () => {
    setStep('upload')
    setParsed(null)
    setMappings({})
    setValidationErrors([])
    setUploadError(null)
    setUploadProgress(0)
    setResult(null)
  }

  // ── Render: Upload ────────────────────────────────────────────────────────

  if (step === 'upload') return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer select-none',
          dragging ? 'border-[#C9A14A] bg-[#C9A14A]/5 scale-[1.01]' : 'border-border hover:border-[#C9A14A]/40',
          uploading && 'pointer-events-none opacity-70',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && document.getElementById('csv-file-input')?.click()}
      >
        <input
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-10 w-10 text-[#C9A14A] animate-spin" />
            <p className="text-white font-medium">Enviando arquivo...</p>
            <div className="mx-auto max-w-xs rounded-full bg-border h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-[#C9A14A] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-white font-medium">Arraste seu arquivo CSV aqui</p>
            <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mt-3 space-x-2">
              <span>Arquivos .csv</span>
              <span>·</span>
              <span>Separador vírgula ou ponto-e-vírgula</span>
              <span>·</span>
              <span>Até 50 MB</span>
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-400">{uploadError}</p>
          </div>
          <button onClick={() => setUploadError(null)} className="text-red-400/60 hover:text-red-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Template hint */}
      <div className="rounded-lg bg-white/[0.03] border border-border p-3">
        <p className="text-xs text-muted-foreground">
          <span className="text-white font-medium">Dica:</span> O CSV precisa ter cabeçalho na primeira linha.
          {importType === 'customers' && ' Colunas sugeridas: Nome, Telefone, Email, Data de Nascimento'}
          {importType === 'appointments' && ' Colunas sugeridas: Telefone Cliente, Data, Serviço, Valor'}
          {importType === 'services' && ' Colunas sugeridas: Nome, Categoria, Preço'}
        </p>
      </div>
    </div>
  )

  // ── Render: Mapping ───────────────────────────────────────────────────────

  if (step === 'mapping' && parsed) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Mapeie as colunas do seu CSV</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {parsed.rowCount.toLocaleString('pt-BR')} linhas detectadas · {parsed.columns.length} colunas
          </p>
        </div>
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-white transition-colors">
          Trocar arquivo
        </button>
      </div>

      {/* Preview */}
      {parsed.preview.length > 0 && (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-white/[0.03]">
                {parsed.columns.slice(0, 5).map((col) => (
                  <th key={col} className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap">{col}</th>
                ))}
                {parsed.columns.length > 5 && <th className="px-3 py-2 text-muted-foreground">+{parsed.columns.length - 5} mais</th>}
              </tr>
            </thead>
            <tbody>
              {parsed.preview.slice(0, 3).map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  {parsed.columns.slice(0, 5).map((col) => (
                    <td key={col} className="px-3 py-2 text-white/70 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">{row[col] ?? '—'}</td>
                  ))}
                  {parsed.columns.length > 5 && <td className="px-3 py-2 text-muted-foreground">...</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mappings */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {Object.entries(FIELD_LABELS)
          .filter(([field]) =>
            field.startsWith(
              importType === 'customers' ? 'customer.' :
              importType === 'appointments' ? 'appointment.' : 'service.'
            )
          )
          .map(([field, label]) => (
            <div key={field} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-xs text-muted-foreground">{label}</span>
              <select
                value={mappings[field] ?? ''}
                onChange={(e) => setMappings({ ...mappings, [field]: e.target.value })}
                className="flex-1 rounded-lg border border-border bg-[#161616] px-3 py-1.5 text-sm text-white focus:border-[#C9A14A] focus:outline-none"
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
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 space-y-1">
          {validationErrors.map((e, i) => (
            <p key={i} className="text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-3 w-3 shrink-0" />{e}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={() => { if (validateMappings()) setStep('import') }}
        className="flex items-center gap-2 rounded-lg bg-[#C9A14A] px-5 py-2 text-sm font-semibold text-[#0B0B0B] hover:bg-[#C9A14A]/90 transition-colors"
      >
        Continuar <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )

  // ── Render: Import ────────────────────────────────────────────────────────

  if (step === 'import') return (
    <div className="space-y-6 text-center py-6">
      {importing ? (
        <>
          <Loader2 className="mx-auto h-10 w-10 text-[#C9A14A] animate-spin" />
          <p className="text-white font-medium">Importando dados...</p>
          <div className="mx-auto max-w-xs rounded-full bg-border h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-[#C9A14A] transition-all duration-500"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Processando {parsed?.rowCount?.toLocaleString('pt-BR')} registros...</p>
        </>
      ) : (
        <>
          <FileText className="mx-auto h-10 w-10 text-[#C9A14A]" />
          <div>
            <p className="text-white font-medium">Pronto para importar</p>
            <p className="text-sm text-muted-foreground mt-1">
              {parsed?.rowCount?.toLocaleString('pt-BR')} linhas serão processadas
            </p>
          </div>

          {validationErrors.length > 0 && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-left space-y-1">
              {validationErrors.map((e, i) => (
                <p key={i} className="text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 shrink-0" />{e}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setStep('mapping')}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={runImport}
              className="rounded-lg bg-[#C9A14A] px-6 py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-[#C9A14A]/90 transition-colors"
            >
              Iniciar importação
            </button>
          </div>
        </>
      )}
    </div>
  )

  // ── Render: Summary ───────────────────────────────────────────────────────

  if (step === 'summary' && result) return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-8 w-8 text-green-400 shrink-0" />
        <div>
          <p className="text-white font-semibold">Importação concluída!</p>
          <p className="text-xs text-muted-foreground">Os dados foram processados com sucesso</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{result.created.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">Criados</p>
        </div>
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{result.updated.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">Atualizados</p>
        </div>
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{result.errors.length.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">Erros</p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-lg bg-red-500/5 border border-red-500/20 p-3 space-y-1">
          {result.errors.slice(0, 10).map((e, i) => (
            <p key={i} className="text-xs text-red-400">{e}</p>
          ))}
          {result.errors.length > 10 && (
            <p className="text-xs text-muted-foreground">+ {result.errors.length - 10} outros erros</p>
          )}
        </div>
      )}

      <button
        onClick={reset}
        className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        Importar outro arquivo
      </button>
    </div>
  )

  return null
}
