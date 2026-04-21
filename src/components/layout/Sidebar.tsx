'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Filter,
  Zap,
  Megaphone,
  FileText,
  Plug,
  Store,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  MessageCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSalon } from '@/hooks/useSalon'
import { useTheme } from '@/components/ui/ThemeProvider'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/chat', label: 'Mensagens', icon: MessageCircle },
  { href: '/segments', label: 'Segmentos', icon: Filter },
  { href: '/automations', label: 'Automações', icon: Zap },
  { href: '/campaigns', label: 'Campanhas', icon: Megaphone },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/integrations', label: 'Integrações', icon: Plug },
  { href: '/salon', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  userEmail?: string
  onCollapseChange?: (collapsed: boolean) => void
}

export default function Sidebar({ userEmail, onCollapseChange }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { salon } = useSalon()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)

  function toggleCollapse() {
    const next = !desktopCollapsed
    setDesktopCollapsed(next)
    onCollapseChange?.(next)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarContent = (
    <>
      {/* Logo / Salon name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.08]">
        <Image src="/nova-logo-retoquei.svg" alt="Retoquei" width={44} height={44} className="shrink-0" />
        {!desktopCollapsed && (
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {salon?.name ?? 'Retoquei'}
            </p>
            <p className="text-xs text-gray-500 truncate">Painel de gestão</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              title={desktopCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#C9A14A]/15 text-[#C9A14A]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${desktopCollapsed ? 'justify-center' : ''}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!desktopCollapsed && <span>{item.label}</span>}
              {active && !desktopCollapsed && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.08] p-3">
        {!desktopCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
            <div className="w-7 h-7 rounded-full bg-[#C9A14A]/20 flex items-center justify-center shrink-0">
              <span className="text-[#C9A14A] text-xs font-semibold">
                {userEmail?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate flex-1">{userEmail}</p>
          </div>
        )}
        <div className={`flex items-center gap-1 ${desktopCollapsed ? 'flex-col' : ''}`}>
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-[#C9A14A] hover:bg-[#C9A14A]/5 transition-colors ${desktopCollapsed ? 'justify-center w-full' : 'flex-1'}`}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {!desktopCollapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors ${desktopCollapsed ? 'justify-center w-full' : ''}`}
            title="Sair"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!desktopCollapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0F0F0F] border-b border-white/[0.08] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Image src="/nova-logo-retoquei.svg" alt="Retoquei" width={36} height={36} />
          <span className="text-sm font-semibold text-white truncate">
            {salon?.name ?? 'Retoquei'}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay — clique fora para fechar */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Mobile slide-out sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#0F0F0F] border-r border-white/[0.08] transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } pt-14`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-[#0F0F0F] border-r border-white/[0.08] transition-all duration-200 ${desktopCollapsed ? 'w-16' : 'w-60'}`}>
        {/* Collapse toggle button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 z-50 w-6 h-6 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-colors shadow-lg"
          title={desktopCollapsed ? 'Expandir' : 'Recolher'}
        >
          <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${desktopCollapsed ? '' : 'rotate-180'}`} />
        </button>
        {sidebarContent}
      </aside>
    </>
  )
}
