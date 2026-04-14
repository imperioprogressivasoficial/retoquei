'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, Loader2, CheckCircle } from 'lucide-react'

export default function CSVImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ importedRows: number; failedRows: number; totalRows: number; errors?: string[] } | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/imports/csv', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erro ao importar')
        return
      }
      setResult(json)
    } catch {
      setError('Erro ao enviar arquivo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/integrations" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Importar via CSV</h1>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Formato esperado</h2>
        <p className="text-xs text-gray-500 mb-3">
          Separador: <strong className="text-gray-300">vírgula (,) ou ponto e vírgula (;)</strong> — detectado automaticamente.<br/>
          Colunas obrigatórias: <strong className="text-gray-300">nome</strong> e <strong className="text-gray-300">telefone</strong>. Opcional: email, ultima_visita, visitas, total_gasto.
        </p>
        <code className="block text-xs bg-black/30 rounded-lg p-3 text-gray-300 font-mono">
          nome;telefone;email;ultima_visita;visitas;total_gasto
        </code>
        <p className="text-xs text-gray-400 mt-2">Também aceita: name, phone, celular, whatsapp, last_visit, visit_count, total_spent</p>
      </div>

      {result ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-1">Importação concluída!</h3>
          <p className="text-sm text-gray-400">
            {result.importedRows} de {result.totalRows} clientes importados.
            {result.failedRows > 0 && ` ${result.failedRows} registros ignorados.`}
          </p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3 text-left bg-black/20 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Detalhes dos erros:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400">{e}</p>
              ))}
            </div>
          )}
          {result.importedRows === 0 && (
            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-left">
              <p className="text-xs text-yellow-400 font-medium">Nenhum cliente importado.</p>
              <p className="text-xs text-yellow-500/70 mt-1">
                Verifique se o arquivo tem as colunas "nome" e "telefone" (ou "name" e "phone").
              </p>
            </div>
          )}
          <div className="flex gap-3 mt-4 justify-center">
            <button
              onClick={() => { setResult(null); setFile(null) }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Importar outro arquivo
            </button>
            <Link href="/clients" className="text-sm text-[#C9A14A] hover:underline font-medium">
              Ver clientes →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">Arquivo CSV *</label>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-[#C9A14A]/50 bg-[#C9A14A]/5' : 'border-white/10 hover:border-white/20'}`}>
                {file ? (
                  <div>
                    <CheckCircle className="h-8 w-8 text-[#C9A14A] mx-auto mb-2" />
                    <p className="text-sm text-white font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs text-gray-500 hover:text-red-400 mt-2 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 mb-1">Arraste ou clique para selecionar</p>
                    <p className="text-xs text-gray-400">Apenas arquivos .csv</p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".csv"
                  className={file ? 'hidden' : 'absolute inset-0 opacity-0 cursor-pointer'}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-[#C9A14A] text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </span>
              ) : (
                'Importar clientes'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
