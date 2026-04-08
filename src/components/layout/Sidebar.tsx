'use client'

import Link from 'next/link'
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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSalon } from '@/hooks/useSalon'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/segments', label: 'Segmentos', icon: Filter },
  { href: '/automations', label: 'Automações', icon: Zap },
  { href: '/campaigns', label: 'Campanhas', icon: Megaphone },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/integrations', label: 'Integrações', icon: Plug },
  { href: '/salon', label: 'Meu Salão', icon: Store },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  userEmail?: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { salon } = useSalon()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-60 bg-[#0F0F0F] border-r border-white/[0.08]">
      {/* Logo / Salon name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.08]">
        <div className="w-8 h-8 rounded-lg bg-[#C9A14A]/20 flex items-center justify-center shrink-0">
          <span className="text-[#C9A14A] text-xs font-bold">R</span>
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-white truncate">
            {salon?.name ?? 'Retoquei'}
          </p>
          <p className="text-xs text-gray-500 truncate">Painel de gestão</p>
        </div>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#C9A14A]/15 text-[#C9A14A]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.08] p-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div className="w-7 h-7 rounded-full bg-[#C9A14A]/20 flex items-center justify-center shrink-0">
            <span className="text-[#C9A14A] text-xs font-semibold">
              {userEmail?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate flex-1">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
