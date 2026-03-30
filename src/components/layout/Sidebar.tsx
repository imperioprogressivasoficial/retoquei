'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Tag, Zap, Megaphone, FileText,
  Plug, Settings, Shield, ChevronRight, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
]

const bottomItems = [
  { href: '/settings', label: 'Configurações', icon: Settings },
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
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-[#0B0B0B]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-[#0B0B0B] font-black text-lg select-none">
          Q
        </div>
        <span className="font-semibold text-white tracking-tight text-[15px]">Retoquei</span>
      </div>

      {/* Tenant name */}
      <div className="px-5 py-3 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Espaço</p>
        <p className="text-sm font-medium text-white truncate mt-0.5">{tenantName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all',
                    active
                      ? 'bg-gold/10 text-gold font-medium border-l-2 border-gold ml-0 pl-[10px]'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-gold' : '')} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Admin link (only shown to admins — handled via server component or context) */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="px-3 text-xs text-muted-foreground uppercase tracking-widest mb-2">Sistema</p>
          <ul className="space-y-0.5">
            {bottomItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all',
                      active
                        ? 'bg-gold/10 text-gold font-medium border-l-2 border-gold pl-[10px]'
                        : 'text-muted-foreground hover:text-white hover:bg-white/5',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="ml-2 rounded-md p-1.5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
