'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'

interface DashboardFiltersProps {
  onFilterChange: (filters: DashboardFilter) => void
}

export interface DashboardFilter {
  dateRange: 'week' | 'month' | '3months' | 'all'
  stage: 'ALL' | 'NEW' | 'RECURRING' | 'VIP' | 'AT_RISK' | 'LOST'
}

const dateRangeLabels = {
  week: '1 semana',
  month: '1 mês',
  '3months': '3 meses',
  all: 'Tudo',
}

const stageLabels = {
  ALL: 'Todos os estágios',
  NEW: 'Novos',
  RECURRING: 'Recorrentes',
  VIP: 'VIP',
  AT_RISK: 'Em risco',
  LOST: 'Perdidos',
}

export default function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<DashboardFilter>({
    dateRange: 'month',
    stage: 'ALL',
  })

  function handleFilterChange(key: keyof DashboardFilter, value: string) {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters as DashboardFilter)
    onFilterChange(newFilters)
  }

  function handleReset() {
    const defaultFilters: DashboardFilter = {
      dateRange: 'month',
      stage: 'ALL',
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const activeFilters = Object.values(filters).filter((v) => v !== 'month' && v !== 'ALL')

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors text-sm text-gray-300"
      >
        <Filter className="h-4 w-4" />
        Filtros {activeFilters.length > 0 && <span className="text-[#C9A14A]">({activeFilters.length})</span>}
      </button>

      {showFilters && (
        <div className="mt-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2 font-medium">
              Período
            </label>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(dateRangeLabels) as [keyof typeof dateRangeLabels, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleFilterChange('dateRange', key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.dateRange === key
                      ? 'bg-[#C9A14A] text-black'
                      : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Lifecycle Stage Filter */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2 font-medium">
              Estágio do cliente
            </label>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(stageLabels) as [keyof typeof stageLabels, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleFilterChange('stage', key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.stage === key
                      ? 'bg-[#C9A14A] text-black'
                      : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          {activeFilters.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
