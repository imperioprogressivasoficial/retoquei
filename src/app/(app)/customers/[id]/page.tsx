import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { LifecycleBadge } from '@/components/customers/LifecycleBadge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Phone, Mail, Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

// ---------------------------------------------------------------------------
// Customer Profile Page
// ---------------------------------------------------------------------------

export default async function CustomerProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) redirect('/onboarding/1')

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, tenantId, deletedAt: null },
    include: {
      metrics: true,
      appointments: {
        include: { service: true, professional: true },
        orderBy: { scheduledAt: 'desc' },
        take: 20,
      },
      segmentMemberships: {
        include: { segment: true },
      },
    },
  })

  if (!customer) notFound()

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return (
    <div>
      <TopBar title="Perfil do Cliente" />
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* Back */}
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Voltar para Clientes
        </Link>

        {/* Header */}
        <div className="rounded-xl border border-border bg-[#1E1E1E] p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-lg">
                  {customer.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{customer.fullName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <LifecycleBadge stage={customer.lifecycleStage} />
                  </div>
                </div>
              </div>
            </div>
            {/* Tags */}
            {customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {customer.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white/5 border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-6 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {customer.phoneE164}
            </span>
            {customer.email && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {customer.email}
              </span>
            )}
            {customer.birthdate && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {format(customer.birthdate, 'dd/MM/yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Metrics */}
        {customer.metrics && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-[#1E1E1E] p-4">
              <p className="text-xs text-muted-foreground">Visitas</p>
              <p className="text-2xl font-bold text-white mt-1">{customer.metrics.totalAppointments}</p>
            </div>
            <div className="rounded-xl border border-border bg-[#1E1E1E] p-4">
              <p className="text-xs text-muted-foreground">Gasto Total</p>
              <p className="text-2xl font-bold text-white mt-1">{fmtCurrency(customer.metrics.totalSpent)}</p>
            </div>
            <div className="rounded-xl border border-border bg-[#1E1E1E] p-4">
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold text-white mt-1">{fmtCurrency(customer.metrics.avgTicket)}</p>
            </div>
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
              <p className="text-xs text-muted-foreground">LTV</p>
              <p className="text-2xl font-bold text-gold mt-1">{fmtCurrency(customer.metrics.ltv)}</p>
            </div>
          </div>
        )}

        {/* Appointment history + segments in two columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Appointments — 2/3 */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-[#1E1E1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Histórico de Visitas</h2>
            {customer.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum agendamento registrado</p>
            ) : (
              <div className="space-y-3">
                {customer.appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-white">{appt.service?.name ?? 'Serviço não especificado'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(appt.scheduledAt, 'dd/MM/yyyy', { locale: ptBR })}
                        {appt.professional && ` · ${appt.professional.name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {appt.price != null && (
                        <p className="text-sm font-medium text-white">{fmtCurrency(appt.price)}</p>
                      )}
                      <span className={`text-xs ${appt.status === 'COMPLETED' ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {appt.status === 'COMPLETED' ? 'Concluído' : appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Segments — 1/3 */}
          <div className="rounded-xl border border-border bg-[#1E1E1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Segmentos</h2>
            {customer.segmentMemberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum segmento</p>
            ) : (
              <div className="flex flex-col gap-2">
                {customer.segmentMemberships.map((m) => (
                  <span key={m.segmentId} className="rounded-lg border border-border bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                    {m.segment.name}
                  </span>
                ))}
              </div>
            )}

            {customer.metrics?.predictedReturnDate && (
              <div className="mt-6 rounded-lg border border-gold/20 bg-gold/5 p-3">
                <p className="text-xs text-muted-foreground">Retorno previsto</p>
                <p className="text-sm font-semibold text-gold mt-0.5">
                  {format(customer.metrics.predictedReturnDate, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(customer.metrics.predictedReturnDate, { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
