import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Retoquei', template: '%s · Retoquei' },
  description:
    'Motor de retenção inteligente para salões de beleza. Conecte seu sistema de agendamento, identifique clientes em risco e recupere-os automaticamente via WhatsApp.',
  keywords: ['salão', 'retenção', 'clientes', 'automação', 'whatsapp', 'CRM', 'beleza'],
  icons: { icon: '/icon.png', apple: '/icon.png' },
  openGraph: {
    title: 'Retoquei | Retenção Inteligente para Salões de Beleza',
    description: 'Automatize a retenção de clientes no seu salão com WhatsApp e inteligência artificial.',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary',
    title: 'Retoquei',
    description: 'Motor de retenção inteligente para salões de beleza.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-[#0B0B0B] text-white`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
