import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white">
        <Sidebar userEmail={user.email} />
        <main className="pl-60 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    )
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    redirect('/login')
  }
}
