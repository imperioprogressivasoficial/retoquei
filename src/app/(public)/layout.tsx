'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RetoqueiWordmark } from '@/components/ui/RetoqueiLogo'

const navLinks = [
  { label: 'Funcionalidades', href: '/#features' },
  { label: 'Como funciona', href: '/#how-it-works' },
  { label: 'Preços', href: '/pricing' },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'

  return (
    <div className="min-h-screen bg-background">
      {!isAuthPage && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-xl">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <RetoqueiWordmark height={36} />
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-7">
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
                className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors shadow-lg shadow-gold/20"
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
