'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'

interface MediaValue {
  url: string
  type: string
  name: string
}

interface MediaUploadProps {
  value: MediaValue | null
  onChange: (media: MediaValue | null) => void
  disabled?: boolean
}

export default function MediaUpload({ value, onChange, disabled }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao enviar arquivo')
        return
      }
      onChange({ url: data.url, type: data.type, name: data.name })
    } catch {
      setError('Erro de rede ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // allow re-selecting same file
  }

  function clear() {
    onChange(null)
    setError('')
  }

  const isImage = value?.type.startsWith('image/')
  const isPdf = value?.type === 'application/pdf'

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        onChange={handleChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {!value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full border border-dashed border-white/15 hover:border-[#C9A14A]/40 hover:bg-white/[0.02] rounded-lg py-4 px-4 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Anexar imagem ou PDF
            </>
          )}
        </button>
      )}

      {value && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 flex items-center gap-3">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.url}
              alt={value.name}
              className="w-14 h-14 rounded-md object-cover shrink-0 border border-white/5"
            />
          ) : isPdf ? (
            <div className="w-14 h-14 rounded-md bg-red-500/15 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-red-400" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-md bg-white/5 flex items-center justify-center shrink-0">
              <ImageIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{value.name}</p>
            <p className="text-xs text-gray-500">
              {isImage ? 'Imagem' : isPdf ? 'PDF' : 'Arquivo'}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
            aria-label="Remover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        JPG, PNG, WEBP, GIF ou PDF até 10MB.
      </p>
    </div>
  )
}
