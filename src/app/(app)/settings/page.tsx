import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { tenantUsers: { include: { tenant: true }, take: 1 } },
  })
  const tenant = dbUser?.tenantUsers[0]?.tenant
  if (!tenant) redirect('/onboarding/1')

  return (
    <div>
      <TopBar title="Configurações" />
      <div className="p-6 max-w-2xl mx-auto">
        <SettingsForm tenant={{ id: tenant.id, name: tenant.name, slug: tenant.slug }} />
      </div>
    </div>
  )
}
