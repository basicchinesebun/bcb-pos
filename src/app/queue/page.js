'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function QueuePage() {
  const [currentQueue, setCurrentQueue] = useState(null)
  const [waiting, setWaiting] = useState(null)
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [flash, setFlash] = useState(false)
  const [live, setLive] = useState(false)
  const flashTimer = useRef(null)
  const lastSeen = useRef(null)
  // Customers open this on their own phone, where a chime out of nowhere is
  // startling (and blocked by the browser until they tap anyway). Sound is for
  // the board mounted in the shop: /queue?sound=1
  const soundOn = useRef(false)

  function triggerFlash() {
    setFlash(true)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(false), 1200)
    if (!soundOn.current) return
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

  function applyQueue(val) {
    if (val == null) return
    const next = String(val)
    if (lastSeen.current !== null && lastSeen.current !== next) triggerFlash()
    lastSeen.current = next
    setCurrentQueue(next)
  }

  useEffect(() => {
    if (!supabase) return
    soundOn.current = new URLSearchParams(window.location.search).get('sound') === '1'

    async function refresh() {
      const { data } = await supabase.from('shop_config').select('key,value')
        .in('key', ['current_queue', 'shop_info'])
      if (data) {
        const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
        applyQueue(cfg.current_queue)
        if (cfg.shop_info) { try { setShopInfo(JSON.parse(cfg.shop_info)) } catch (_) {} }
      }
      // How many are still ahead. "What number are you on" is really "how long
      // do I have to wait", and the number alone doesn't answer that.
      const { count } = await supabase.from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('done', false).eq('cancelled', false).eq('status', 'confirmed')
      if (typeof count === 'number') setWaiting(count)
    }

    refresh()
    // A phone left on this page can't rely on the socket staying up — if it
    // drops, the number silently freezes and the customer keeps waiting on a
    // stale figure. Poll as a floor, and refetch whenever they look again.
    const poll = setInterval(refresh, 5000)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)

    const ch = supabase.channel('queue-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_config', filter: 'key=eq.current_queue' },
        payload => applyQueue(payload.new?.value))
      .subscribe(status => setLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(ch)
      clearInterval(poll)
      clearTimeout(flashTimer.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const displayNum = currentQueue ? String(currentQueue).padStart(4, '0') : '- - - -'

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center select-none px-6 py-8"
      style={{ background: flash ? '#1a0e06' : 'var(--brown)', transition: 'background 0.4s ease' }}
    >
      <div className="text-center w-full">
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
            fontSize: 'clamp(90px, 22vw, 320px)',
            color: flash ? '#FFD700' : 'var(--cream)',
            textShadow: flash ? '0 0 80px rgba(255,215,0,0.6)' : 'none',
            transform: flash ? 'scale(1.04)' : 'scale(1)',
            transformOrigin: 'center',
            display: 'inline-block',
            transitionProperty: 'color, text-shadow, transform',
            transitionDuration: flash ? '0.1s, 0.1s, 0.1s' : '0.4s, 0.4s, 0.4s',
          }}
        >
          {displayNum}
        </div>

        {waiting !== null && (
          <div
            className="mt-6 inline-block rounded-2xl px-6 py-3"
            style={{ background: 'rgba(253,246,238,0.1)' }}
          >
            <div className="font-black" style={{ fontSize: 'clamp(13px,2vw,18px)', color: 'rgba(253,246,238,0.55)' }}>
              ຄິວທີ່ລໍຖ້າຢູ່ · WAITING
            </div>
            <div className="font-serif font-black leading-tight" style={{ fontSize: 'clamp(30px,5vw,52px)', color: 'var(--cream)' }}>
              {waiting}
            </div>
          </div>
        )}

        {!currentQueue && (
          <div
            className="mt-8 font-black"
            style={{ fontSize: 'clamp(12px, 2vw, 20px)', color: 'rgba(253,246,238,0.25)' }}
          >
            ລໍຖ້າການເອີ້ນຄິວ · Waiting for queue call
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold"
          style={{ color: 'rgba(253,246,238,0.3)' }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: live ? '#22c55e' : '#f59e0b' }} />
          {live ? 'ອັບເດດອັດຕະໂນມັດ' : 'ກຳລັງເຊື່ອມຕໍ່...'}
        </div>
      </div>
    </div>
  )
}
