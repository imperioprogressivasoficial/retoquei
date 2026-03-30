'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Funcionalidades', href: '/#features' },
  { label: 'Como funciona', href: '/#how-it-works' },
  { label: 'Preços', href: '/#pricing' },
]

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'

  return (
    <div className="min-h-screen bg-background">
      {!isAuthPage && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gold-gradient shadow-lg shadow-[#C9A14A]/20 transition-all group-hover:shadow-[#C9A14A]/40">
                <span className="text-sm font-black text-[#0B0B0B]">R</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Retoquei
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm px-4 py-2 rounded-md font-semibold"
              >
                Começar grátis
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className={!isAuthPage ? 'pt-16' : ''}>{children}</main>
    </div>
  )
}
