'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Tag, Zap, Megaphone, FileText,
  Plug, Settings, Shield, LogOut, Smartphone, BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RetoqueiLogo } from '@/components/ui/RetoqueiLogo'

// ---------------------------------------------------------------------------
// Sidebar — premium dark navigation for the Retoquei app shell
// ---------------------------------------------------------------------------

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/customers',    label: 'Clientes',     icon: Users },
  { href: '/segments',     label: 'Segmentos',    icon: Tag },
  { href: '/flows',        label: 'Automações',   icon: Zap },
  { href: '/campaigns',    label: 'Campanhas',    icon: Megaphone },
  { href: '/templates',    label: 'Templates',    icon: FileText },
  { href: '/integrations', label: 'Integrações',  icon: Plug },
  { href: '/analytics',    label: 'Análises',     icon: BarChart2 },
]

const bottomItems = [
  { href: '/settings/whatsapp', label: 'WhatsApp',       icon: Smartphone },
  { href: '/settings',          label: 'Configurações',  icon: Settings },
]

interface SidebarProps {
  tenantName?: string
  userEmail?: string
}

export function Sidebar({ tenantName = 'Salão Aurora', userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-[220px] flex-col border-r border-white/[0.06] bg-[#0A0A0A]">
      {/* Logo + wordmark */}
      <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-white/[0.06]">
        <RetoqueiLogo size={30} withText textColor="#FFFFFF" />
      </div>

      {/* Tenant badge */}
      <div className="px-4 py-2.5 border-b border-white/[0.06]">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.12em] font-semibold mb-0.5">Espaço de trabalho</p>
        <p className="text-[13px] font-medium text-white/80 truncate">{tenantName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] transition-all duration-150',
                active
                  ? 'bg-gold/[0.12] text-gold font-semibold'
                  : 'text-white/45 hover:text-white/90 hover:bg-white/[0.05]',
              )}
            >
              <Icon className={cn('h-[15px] w-[15px] shrink-0 transition-colors', active ? 'text-gold' : 'group-hover:text-white/80')} />
              {item.label}
              {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
            </Link>
          )
        })}

        {/* System section */}
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <p className="px-3 text-[10px] text-white/25 uppercase tracking-[0.12em] font-semibold mb-2">Sistema</p>
          {bottomItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] transition-all duration-150',
                  active
                    ? 'bg-gold/[0.12] text-gold font-semibold'
                    : 'text-white/45 hover:text-white/90 hover:bg-white/[0.05]',
                )}
              >
                <Icon className="h-[15px] w-[15px] shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold text-[11px] font-bold">
            {(userEmail?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/40 truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-white/30 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
