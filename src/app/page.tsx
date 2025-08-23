'use client'

import { useState } from 'react'
import HomePage from '@/components/HomePage'
import WakeFlow from '@/components/WakeFlow'

export default function Home() {
  const [isStarted, setIsStarted] = useState(false)

  return (
    <main className="min-h-screen">
      {!isStarted ? (
        <HomePage onStart={() => setIsStarted(true)} />
      ) : (
        <WakeFlow onComplete={() => setIsStarted(false)} />
      )}
    </main>
  )
}
