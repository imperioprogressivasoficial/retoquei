import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Retoquei | Retenção Inteligente para Salões',
  description:
    'Transforme o histórico de agendamentos do seu salão em clientes que voltam. Motor de retenção inteligente com automação de WhatsApp.',
  keywords: ['salão', 'retenção', 'clientes', 'automação', 'whatsapp', 'CRM'],
  openGraph: {
    title: 'Retoquei | Retenção Inteligente para Salões',
    description:
      'Motor de retenção inteligente para salões de beleza. Conecte, analise e automatize.',
    type: 'website',
    locale: 'pt_BR',
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
                background: '#1E1E1E',
                border: '1px solid #2A2A2A',
                color: '#FAFAFA',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
