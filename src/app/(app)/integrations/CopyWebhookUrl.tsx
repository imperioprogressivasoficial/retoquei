'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyWebhookUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="text-xs text-gray-300 truncate flex-1 select-all">{url}</code>
      <button
        onClick={handleCopy}
        className="shrink-0 p-1.5 rounded hover:bg-white/10 transition-colors"
        title="Copiar URL"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>
    </div>
  )
}
