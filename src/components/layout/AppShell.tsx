'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import BetaBanner from '@/components/ui/BetaBanner'
import SupportButton from '@/components/ui/SupportButton'
import ConfirmProvider from '@/components/ui/ConfirmProvider'

interface AppShellProps {
  userEmail?: string
  children: React.ReactNode
}

export default function AppShell({ userEmail, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <Sidebar userEmail={userEmail} onCollapseChange={setCollapsed} />
      <main className={`min-h-screen pt-14 lg:pt-0 transition-all duration-200 ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>
        <BetaBanner />
        <div className="p-4 sm:p-6 lg:p-8">
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </div>
      </main>
      <SupportButton />
    </div>
  )
}
