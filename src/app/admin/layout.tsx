import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Shield, Users, Briefcase, Webhook, Plug } from 'lucide-react'

// ---------------------------------------------------------------------------
// Admin Layout — only accessible to platform admins
// ---------------------------------------------------------------------------

const adminNav = [
  { href: '/admin',            label: 'Overview',    icon: Shield },
  { href: '/admin/tenants',    label: 'Tenants',     icon: Users },
  { href: '/admin/jobs',       label: 'Jobs / Filas',icon: Briefcase },
  { href: '/admin/webhooks',   label: 'Webhooks',    icon: Webhook },
  { href: '/admin/connectors', label: 'Conectores',  icon: Plug },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser?.isPlatformAdmin) redirect('/app/dashboard')

  return (
    <div className="flex h-screen bg-[#0B0B0B]">
      {/* Admin sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border bg-[#0B0B0B] flex flex-col">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gold flex items-center justify-center text-[#0B0B0B] font-black text-sm">Q</div>
            <span className="text-white font-semibold text-sm">Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-2">
          {adminNav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Link href="/app/dashboard" className="text-xs text-muted-foreground hover:text-white">← Voltar ao app</Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
