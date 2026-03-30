'use client'

import { Bell, Search } from 'lucide-react'

// ---------------------------------------------------------------------------
// TopBar — minimal app header
// ---------------------------------------------------------------------------

interface TopBarProps {
  title: string
  subtitle?: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-[#0B0B0B] px-6">
      <div>
        <h1 className="text-[15px] font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-md p-1.5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
