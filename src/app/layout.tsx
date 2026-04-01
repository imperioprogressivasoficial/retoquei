import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
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
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%230B0B0B'/><circle cx='47' cy='46' r='26' stroke='%23C9A14A' stroke-width='13' fill='none'/><line x1='63' y1='62' x2='81' y2='82' stroke='%23C9A14A' stroke-width='13' stroke-linecap='round'/></svg>",
        type: 'image/svg+xml',
      },
    ],
  },
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
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#F5F5F5',
                borderRadius: '10px',
                fontSize: '13px',
              },
            }}
          />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
