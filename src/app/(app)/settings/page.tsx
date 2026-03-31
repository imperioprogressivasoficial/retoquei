import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let tenant: { id: string; name: string; slug: string } | null = null
  try {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { ownedTenants: { include: { tenant: true }, take: 1 } },
    })
    tenant = dbUser?.ownedTenants[0]?.tenant ?? null
  } catch { }

  if (!tenant) {
    return (
      <div>
        <TopBar title="Configurações" />
        <div className="p-6 max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">Configure seu salão primeiro no onboarding.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopBar title="Configurações" />
      <div className="p-6 max-w-2xl mx-auto">
        <SettingsForm tenant={{ id: tenant.id, name: tenant.name, slug: tenant.slug }} />
      </div>
    </div>
  )
}
