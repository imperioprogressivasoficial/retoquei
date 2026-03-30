'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Customer Evolution Chart — area chart showing customer base growth
// ---------------------------------------------------------------------------

interface DataPoint {
  month: string   // YYYY-MM
  total: number
  new: number
  recurring: number
}

interface CustomerEvolutionChartProps {
  data: DataPoint[]
}

const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (!active || !payload || !(payload as unknown[]).length) return null
  const typedPayload = payload as Array<{ name: string; value: number; color: string }>
  return (
    <div className="rounded-lg border border-border bg-[#1E1E1E] p-3 shadow-lg text-sm">
      <p className="font-medium text-white mb-2">
        {format(parseISO(String(label) + '-01'), 'MMM yyyy', { locale: ptBR })}
      </p>
      {typedPayload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="text-white font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function CustomerEvolutionChart({ data }: CustomerEvolutionChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.month,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C9A14A" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C9A14A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => {
            try { return format(parseISO(v + '-01'), 'MMM', { locale: ptBR }) }
            catch { return v }
          }}
        />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          name="total"
          stroke="#C9A14A"
          strokeWidth={2}
          fill="url(#totalGrad)"
        />
        <Area
          type="monotone"
          dataKey="new"
          name="novos"
          stroke="#3b82f6"
          strokeWidth={1.5}
          fill="url(#newGrad)"
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
