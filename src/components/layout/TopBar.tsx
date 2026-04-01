'use client'

import { Bell } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0A0A0A]/90 backdrop-blur-sm px-6">
      <div>
        <h1 className="text-[15px] font-semibold text-white leading-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          className="rounded-lg p-1.5 text-white/30 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          title="Notificações"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
