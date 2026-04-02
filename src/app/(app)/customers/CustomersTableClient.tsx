'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { LifecycleBadge } from '@/components/customers/LifecycleBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, X } from 'lucide-react'

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

const LIFECYCLE_FILTERS = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'AT_RISK', label: 'Em Risco' },
  { value: 'LOST', label: 'Perdido' },
  { value: 'VIP', label: 'VIP' },
]

export function CustomersTableClient({ data }: { data: CustomerRow[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLifecycle, setSelectedLifecycle] = useState<string | null>(null)

  // Client-side filtering
  const filteredData = data.filter(customer => {
    const matchesSearch =
      customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneE164.includes(searchTerm)
    const matchesLifecycle = !selectedLifecycle || customer.lifecycleStage === selectedLifecycle
    return matchesSearch && matchesLifecycle
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-[#1E1E1E] text-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Lifecycle Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLifecycle(null)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              selectedLifecycle === null
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-border bg-white/5 text-muted-foreground hover:text-white'
            }`}
          >
            Todos
          </button>
          {LIFECYCLE_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setSelectedLifecycle(filter.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                selectedLifecycle === filter.value
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-border bg-white/5 text-muted-foreground hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {filteredData.length} de {data.length} clientes
        </p>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        emptyMessage="Nenhum cliente encontrado. Importe dados via Integrações."
        onRowClick={(row) => router.push(`/customers/${row.id}`)}
      />
    </div>
  )
}
