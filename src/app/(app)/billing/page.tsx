import { TopBar } from '@/components/layout/TopBar'
import { CreditCard } from 'lucide-react'

// ---------------------------------------------------------------------------
// Billing — stub page (Phase 3: connect to Stripe)
// TODO: Integrate with Stripe Billing / Checkout
// ---------------------------------------------------------------------------

export default function BillingPage() {
  return (
    <div>
      <TopBar title="Plano & Cobrança" />
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-white">Gestão de plano em breve</p>
          <p className="text-xs text-muted-foreground mt-1">
            Integração com Stripe será adicionada na próxima fase.
          </p>
        </div>
      </div>
    </div>
  )
}
