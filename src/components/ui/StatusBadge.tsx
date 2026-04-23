import React from 'react'

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'info' | 'error' | 'pending'
  label: string
  variant?: 'solid' | 'subtle'
}

const statusStyles = {
  success: {
    solid: 'bg-[hsl(142_76%_36%)] text-white',
    subtle: 'bg-[hsl(142_76%_36%)]/15 text-[hsl(142_76%_36%)]',
  },
  warning: {
    solid: 'bg-[hsl(38_92%_50%)] text-black',
    subtle: 'bg-[hsl(38_92%_50%)]/15 text-[hsl(38_92%_50%)]',
  },
  info: {
    solid: 'bg-[hsl(217_91%_60%)] text-black',
    subtle: 'bg-[hsl(217_91%_60%)]/15 text-[hsl(217_91%_60%)]',
  },
  error: {
    solid: 'bg-[hsl(0_84%_60%)] text-white',
    subtle: 'bg-[hsl(0_84%_60%)]/15 text-[hsl(0_84%_60%)]',
  },
  pending: {
    solid: 'bg-gray-600 text-white',
    subtle: 'bg-gray-600/15 text-gray-400',
  },
}

export function StatusBadge({
  status,
  label,
  variant = 'subtle',
}: StatusBadgeProps) {
  const styles = statusStyles[status][variant]

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles}`}>
      {label}
    </span>
  )
}
