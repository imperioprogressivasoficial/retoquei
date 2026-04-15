'use client'

import { useState, useEffect } from 'react'
import { X, FlaskConical } from 'lucide-react'

export default function BetaBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('beta-banner-dismissed')
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem('beta-banner-dismissed', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-[#C9A14A]/10 border-b border-[#C9A14A]/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="h-4 w-4 text-[#C9A14A] shrink-0" />
          <p className="text-xs text-[#C9A14A] truncate">
            <span className="font-semibold">Versao beta</span> — seu feedback e essencial para melhorarmos a plataforma
          </p>
        </div>
        <button
          onClick={dismiss}
          className="p-1 text-[#C9A14A]/60 hover:text-[#C9A14A] transition-colors shrink-0"
          aria-label="Fechar banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
