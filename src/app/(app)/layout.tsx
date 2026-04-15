import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import ConfirmProvider from '@/components/ui/ConfirmProvider'
import BetaBanner from '@/components/ui/BetaBanner'
import SupportButton from '@/components/ui/SupportButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white">
        <BetaBanner />
        <Sidebar userEmail={user.email} />
        <main className="lg:pl-60 min-h-screen pt-14 lg:pt-0">
          <div className="p-4 sm:p-6 lg:p-8">
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </div>
        </main>
        <SupportButton />
      </div>
    )
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    redirect('/login')
  }
}
