import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

const steps = [
  { number: 1, label: 'Sobre você' },
  { number: 2, label: 'Seu salão' },
  { number: 3, label: 'Conectar sistema' },
  { number: 4, label: 'Importar dados' },
  { number: 5, label: 'WhatsApp' },
  { number: 6, label: 'Tudo pronto!' },
]

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gold-gradient">
              <span className="text-xs font-black text-[#0B0B0B]">R</span>
            </div>
            <span className="font-bold text-foreground">Retoquei</span>
          </Link>
          <span className="text-xs text-muted-foreground">
            Precisa de ajuda?{' '}
            <a href="mailto:suporte@retoquei.com.br" className="text-[#C9A14A] hover:underline">
              Fale conosco
            </a>
          </span>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-border bg-card/20 px-6 py-4">
        <div className="container mx-auto">
          {/* Mobile: just step count */}
          <div className="flex items-center justify-center sm:hidden">
            <span className="text-sm text-muted-foreground">Configure sua conta</span>
          </div>

          {/* Desktop: full steps */}
          <div className="hidden sm:flex items-center justify-center gap-0">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all`}
                    data-step={step.number}
                    id={`step-indicator-${step.number}`}
                  >
                    <CheckCircle className="h-4 w-4 hidden" />
                    <span>{step.number}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-2 mb-4 h-px w-12 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-12">
        <div className="container mx-auto max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  )
}
