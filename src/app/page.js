'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    window.location.replace('/order')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="text-sm font-bold" style={{ color: 'var(--brown)' }}>ກຳລັງໂຫຼດ...</div>
    </div>
  )
}
