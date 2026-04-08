'use client'

import { useState, useEffect } from 'react'

interface Salon {
  id: string
  name: string
  slug: string
  phone: string | null
  email: string | null
}

export function useSalon() {
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSalon() {
      try {
        const res = await fetch('/api/salons')
        if (res.ok) {
          const data = await res.json()
          setSalon(data.salon ?? null)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchSalon()
  }, [])

  return { salon, loading }
}
