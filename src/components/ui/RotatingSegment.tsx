'use client'

import { useEffect, useState } from 'react'

const SEGMENTS = [
  'salões',
  'barbearias',
  'clínicas de estética',
  'studios de beleza',
  'spas',
  'nail designers',
  'dentistas',
  'personal trainers',
]

export default function RotatingSegment() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const cycle = setInterval(() => {
      // Fade out
      setVisible(false)
      // Swap word + fade in after 250ms
      setTimeout(() => {
        setIndex((i) => (i + 1) % SEGMENTS.length)
        setVisible(true)
      }, 250)
    }, 2200)

    return () => clearInterval(cycle)
  }, [])

  return (
    <span
      className={`inline-block font-semibold transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      }`}
      aria-live="polite"
    >
      {SEGMENTS[index]}
    </span>
  )
}
