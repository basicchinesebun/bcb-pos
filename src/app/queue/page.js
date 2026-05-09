'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function QueuePage() {
  const [currentQueue, setCurrentQueue] = useState(null)
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef(null)

  function triggerFlash() {
    setFlash(true)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(false), 1200)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const gain = ctx.createGain()
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      ;[880, 1100, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.connect(gain)
        osc.frequency.value = freq
        osc.start(ctx.currentTime + i * 0.12)
        osc.stop(ctx.currentTime + i * 0.12 + 0.25)
      })
    } catch (_) {}
  }

  useEffect(() => {
    if (!supabase) return
    supabase.from('shop_config').select('key,value').then(({ data }) => {
      if (!data) return
      const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
      if (cfg.current_queue) setCurrentQueue(cfg.current_queue)
      if (cfg.shop_info) { try { setShopInfo(JSON.parse(cfg.shop_info)) } catch (_) {} }
    })
    const ch = supabase.channel('queue-board')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shop_config', filter: 'key=eq.current_queue' },
        payload => {
          setCurrentQueue(payload.new.value)
          triggerFlash()
        })
      .subscribe()
    return () => { supabase.removeChannel(ch); clearTimeout(flashTimer.current) }
  }, [])

  const displayNum = currentQueue ? String(currentQueue).padStart(4, '0') : '- - - -'

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center select-none"
      style={{
        background: flash ? '#1a0e06' : 'var(--brown)',
        transition: 'background 0.4s ease',
      }}
    >
      <div className="text-center px-8">
        <div
          className="font-serif font-black mb-2"
          style={{ fontSize: 'clamp(16px, 3vw, 28px)', color: 'rgba(253,246,238,0.45)', letterSpacing: '0.05em' }}
        >
          {shopInfo.name}
        </div>

        <div
          className="font-black tracking-widest uppercase mb-6"
          style={{ fontSize: 'clamp(11px, 1.8vw, 18px)', color: 'rgba(253,246,238,0.4)', letterSpacing: '0.25em' }}
        >
          ກຳລັງເອີ້ນ · NOW SERVING
        </div>

        <div
          className="font-serif font-black leading-none"
          style={{
            fontSize: 'clamp(100px, 22vw, 320px)',
            color: flash ? '#FFD700' : 'var(--cream)',
            textShadow: flash ? '0 0 80px rgba(255,215,0,0.6)' : 'none',
            transition: 'color 0.15s ease, text-shadow 0.15s ease',
            transform: flash ? 'scale(1.04)' : 'scale(1)',
            transformOrigin: 'center',
            display: 'inline-block',
            transitionProperty: 'color, text-shadow, transform',
            transitionDuration: flash ? '0.1s, 0.1s, 0.1s' : '0.4s, 0.4s, 0.4s',
          }}
        >
          {displayNum}
        </div>

        {!currentQueue && (
          <div
            className="mt-8 font-black"
            style={{ fontSize: 'clamp(12px, 2vw, 20px)', color: 'rgba(253,246,238,0.25)' }}
          >
            ລໍຖ້າການເອີ້ນຄິວ · Waiting for queue call
          </div>
        )}
      </div>
    </div>
  )
}
