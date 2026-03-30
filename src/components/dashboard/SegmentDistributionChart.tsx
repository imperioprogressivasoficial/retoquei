'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// ---------------------------------------------------------------------------
// Segment Distribution Chart — donut chart of lifecycle stage breakdown
// ---------------------------------------------------------------------------

interface SegmentData {
  name: string
  value: number
  color: string
}

interface SegmentDistributionChartProps {
  data: SegmentData[]
}

const CustomTooltip = ({ active, payload }: Record<string, unknown>) => {
  if (!active || !payload || !(payload as unknown[]).length) return null
  const p = (payload as Array<{ name: string; value: number }>)[0]
  return (
    <div className="rounded-lg border border-border bg-[#1E1E1E] p-3 text-sm shadow-lg">
      <p className="text-white font-medium">{p.name}</p>
      <p className="text-muted-foreground">{p.value} clientes</p>
    </div>
  )
}

export function SegmentDistributionChart({ data }: SegmentDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: '#a1a1aa', fontSize: 11 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
