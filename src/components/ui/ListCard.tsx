'use client'

import React from 'react'

interface ListCardProps {
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

/**
 * Mobile-responsive list card component
 * Shows as individual cards on mobile, rows in table on desktop
 * Include checkbox, title, metadata, and actions as children
 */
export function ListCard({
  isSelected = false,
  onSelect,
  onClick,
  className = '',
  children,
}: ListCardProps) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect?.(e.target.checked)
  }

  return (
    <div
      onClick={onClick}
      className={`relative bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-5 hover:border-[#C9A14A]/30 transition-colors cursor-pointer ${
        isSelected ? 'border-[#C9A14A]/50 bg-[#C9A14A]/5' : ''
      } ${className}`}
    >
      {onSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          className="absolute top-4 left-4 w-4 h-4 rounded border-gray-500 text-[#C9A14A] bg-transparent cursor-pointer accent-[#C9A14A]"
        />
      )}
      <div className={onSelect ? 'ml-7' : ''}>{children}</div>
    </div>
  )
}
