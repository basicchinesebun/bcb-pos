'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabase'

function QRCard({ page, baseUrl }) {
  const canvasRef = useRef(null)
  const [dataUrl, setDataUrl] = useState(null)

  useEffect(() => {
    if (!canvasRef.current || !page.url) return
    QRCode.toCanvas(canvasRef.current, page.url, {
      width: 300,
      margin: 2,
      color: { dark: page.color, light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(() => {
      setDataUrl(canvasRef.current.toDataURL('image/png'))
    }).catch(console.error)
  }, [page.url, page.color])

  function download() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-${page.key}.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-3xl"
      style={{ background: 'var(--warm-white)', border: `3px solid ${page.color}` }}>
      <div className="text-3xl">{page.emoji}</div>
      <div className="text-center">
        <div className="font-serif text-xl font-black" style={{ color: page.color }}>{page.label}</div>
        <div className="text-xs font-bold tracking-widest uppercase mt-0.5" style={{ color: 'var(--gray3)' }}>{page.sublabel}</div>
        {page.code && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black"
            style={{ background: page.color, color: 'white' }}>
            🔐 {page.code}
          </div>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden p-2" style={{ background: 'white', border: `2px solid ${page.color}` }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>

      <div className="text-xs font-bold text-center px-4 py-2 rounded-xl break-all"
        style={{ background: 'var(--cream2)', color: 'var(--brown2)' }}>
        {page.url}
      </div>

      <button
        onClick={download}
        disabled={!dataUrl}
        className="w-full py-3 rounded-xl font-black text-sm active:scale-95 transition-all"
        style={{ background: page.color, color: 'white' }}>
        ⬇ ດາວໂຫລດ PNG
      </button>
    </div>
  )
}

export default function QRPage() {
  const [baseUrl, setBaseUrl] = useState('')
  const [walkinCode, setWalkinCode] = useState('')

  useEffect(() => {
    setBaseUrl(window.location.origin)
    if (supabase) {
      supabase.from('shop_config').select('value').eq('key', 'walkin_code').single()
        .then(({ data }) => { if (data?.value) setWalkinCode(data.value) })
    }
  }, [])

  const pages = [
    {
      key: 'preorder',
      url: baseUrl + '/preorder',
      label: 'ສັ່ງລ່ວງໜ້າ',
      sublabel: 'Pre-Order',
      emoji: '📱',
      color: '#3d1f0a',
      code: null,
    },
    {
      key: 'order',
      url: walkinCode ? `${baseUrl}/order?c=${walkinCode}` : `${baseUrl}/order`,
      label: 'ສັ່ງທີ່ຮ້ານ',
      sublabel: 'Walk-in Order',
      emoji: '🏪',
      color: '#1a3d1f',
      code: walkinCode || null,
    },
  ]

  return (
    <div className="min-h-dvh" style={{ background: 'var(--cream)' }}>
      <div className="text-center py-5 sticky top-0 z-10" style={{ background: 'var(--brown)' }}>
        <div className="flex items-center gap-2 justify-center">
          <img src="/logo.jpg" alt="logo" className="w-7 h-7 rounded-full object-cover" />
          <span className="font-serif text-xl font-black" style={{ color: 'var(--cream)' }}>Basic Chinese Bun</span>
        </div>
        <div className="text-xs font-bold tracking-widest uppercase mt-1" style={{ color: 'rgba(253,246,238,0.55)' }}>QR Code</div>
      </div>

      {walkinCode && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"
          style={{ background: '#fef9c3', color: '#854d0e', border: '2px solid #fde047' }}>
          🔐 Walk-in Code: <span className="font-black tracking-widest">{walkinCode}</span>
          <span className="text-xs ml-auto">ສ້າງ Code ໃໝ່ໄດ້ຢູ່ Staff → ⚙</span>
        </div>
      )}

      <div className="p-4 max-w-lg mx-auto flex flex-col gap-4">
        {baseUrl && pages.map(page => (
          <QRCard key={page.key} page={page} />
        ))}

        <button
          onClick={() => window.print()}
          className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all mt-2"
          style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
          🖨 ປຣິນ QR ທັງໝົດ
        </button>
      </div>

      <style>{`
        @media print {
          header, .sticky { display: none !important; }
          button { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
