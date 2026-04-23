import React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  actionOnClick?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
}: EmptyStateProps) {
  const ActionComponent = actionHref ? Link : 'button'

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-white/[0.03] border border-white/[0.08] rounded-xl">
      <Icon className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-sm text-center">{description}</p>
      {actionLabel && (
        <ActionComponent
          {...(actionHref ? { href: actionHref } : { onClick: actionOnClick })}
          className="flex items-center gap-2 bg-[#C9A14A] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#B8903E] active:bg-[#A0803A] transition-colors"
        >
          {actionLabel}
        </ActionComponent>
      )}
    </div>
  )
}
