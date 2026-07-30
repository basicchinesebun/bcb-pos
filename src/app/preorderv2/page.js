'use client'
import dynamic from 'next/dynamic'

const PreorderV2Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100dvh', background: '#FAF2E7' }} />
  ),
})

export default function PreorderV2Page() {
  return <PreorderV2Content />
}
