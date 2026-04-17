'use client'

import { useEffect, useState } from 'react'

const SEGMENTS = [
  'salões',
  'barbearias',
  'clínicas',
  'estéticas',
  'spas',
  'studios',
  'manicures',
  'dentistas',
]

export default function RotatingSegment() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const cycle = setInterval(() => {
      setIndex((i) => (i + 1) % SEGMENTS.length)
    }, 2200)
    return () => clearInterval(cycle)
  }, [])

  return (
    <span
      className="relative inline-grid overflow-hidden align-baseline"
      style={{ gridTemplateAreas: '"stack"' }}
      aria-live="polite"
    >
      {SEGMENTS.map((segment, i) => {
        const isActive = i === index
        const isPrev = i === (index - 1 + SEGMENTS.length) % SEGMENTS.length
        return (
          <span
            key={segment}
            style={{ gridArea: 'stack' }}
            className={`font-semibold whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isActive
                ? 'opacity-100 translate-y-0'
                : isPrev
                ? 'opacity-0 -translate-y-full'
                : 'opacity-0 translate-y-full'
            }`}
            aria-hidden={!isActive}
          >
            {segment}
          </span>
        )
      })}
    </span>
  )
}
