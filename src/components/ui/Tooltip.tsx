'use client'

import React, { useState } from 'react'

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 200,
}: TooltipProps) {
  const [show, setShow] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const id = setTimeout(() => setShow(true), delay)
    setTimeoutId(id)
  }

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId)
    setShow(false)
  }

  const positionClasses = {
    top: 'bottom-full mb-2 -translate-x-1/2 left-1/2',
    bottom: 'top-full mt-2 -translate-x-1/2 left-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  const arrowClasses = {
    top: 'top-full border-t-[#1A1A1A] border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full border-b-[#1A1A1A] border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full border-l-[#1A1A1A] border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full border-r-[#1A1A1A] border-t-transparent border-b-transparent border-l-transparent',
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && (
        <div
          className={`
            absolute z-50 px-3 py-2 text-xs text-white
            bg-[#1A1A1A] rounded-md whitespace-nowrap
            border border-white/10 shadow-lg
            animate-in fade-in-0 duration-100
            pointer-events-none
            ${positionClasses[side]}
          `}
        >
          {content}
          <div
            className={`
              absolute w-0 h-0
              border-4
              ${arrowClasses[side]}
            `}
          />
        </div>
      )}
    </div>
  )
}
