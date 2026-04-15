import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    return (
      <AppShell userEmail={user.email}>
        {children}
      </AppShell>
    )
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    redirect('/login')
  }
}
