'use client'

import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { LifecycleBadge } from '@/components/customers/LifecycleBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Customers Table — client component with interactivity
// ---------------------------------------------------------------------------

interface CustomerRow {
  id: string
  fullName: string
  phoneE164: string
  lifecycleStage: string
  riskLevel: string
  lastVisitAt: string | null
  daysSinceLastVisit: number | null
  totalAppointments: number
  avgTicket: number
  ltv: number
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: 'fullName',
    header: 'Cliente',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-white">{row.original.fullName}</p>
        <p className="text-xs text-muted-foreground">{row.original.phoneE164}</p>
      </div>
    ),
  },
  {
    accessorKey: 'lifecycleStage',
    header: 'Estágio',
    cell: ({ row }) => <LifecycleBadge stage={row.original.lifecycleStage} />,
  },
  {
    accessorKey: 'lastVisitAt',
    header: 'Última Visita',
    cell: ({ row }) => {
      if (!row.original.lastVisitAt) return <span className="text-muted-foreground text-xs">—</span>
      return (
        <div>
          <p className="text-white text-sm">{format(new Date(row.original.lastVisitAt), 'dd/MM/yyyy', { locale: ptBR })}</p>
          {row.original.daysSinceLastVisit !== null && (
            <p className="text-xs text-muted-foreground">{row.original.daysSinceLastVisit} dias atrás</p>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'totalAppointments',
    header: 'Visitas',
    cell: ({ row }) => (
      <span className="text-white text-sm">{row.original.totalAppointments}</span>
    ),
  },
  {
    accessorKey: 'avgTicket',
    header: 'Ticket Médio',
    cell: ({ row }) => (
      <span className="text-white text-sm">{fmtCurrency(row.original.avgTicket)}</span>
    ),
  },
  {
    accessorKey: 'ltv',
    header: 'LTV',
    cell: ({ row }) => (
      <span className="text-gold text-sm font-medium">{fmtCurrency(row.original.ltv)}</span>
    ),
  },
]

export function CustomersTableClient({ data }: { data: CustomerRow[] }) {
  const router = useRouter()

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhum cliente encontrado. Importe dados via Integrações."
      onRowClick={(row) => router.push(`/app/customers/${row.id}`)}
    />
  )
}
