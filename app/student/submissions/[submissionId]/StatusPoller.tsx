'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Refreshes the server component while analysis is still running, so the student
 * sees the status advance from pending -> analysing -> ready without a manual
 * reload. Stops polling once a terminal status is reached.
 */
export function StatusPoller({ active }: { active: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(id)
  }, [active, router])
  return null
}
