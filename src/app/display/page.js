'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function DisplayPage() {
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [qrImage, setQrImage] = useState(null)
  const [order, setOrder] = useState({ items: [], total: 0 })

  useEffect(() => {
    if (!supabase) return
    supabase.from('shop_config').select('key,value').then(({ data }) => {
      if (!data) return
      const cfg = Object.fromEntries(data.map(r => [r.key, r.value]))
      if (cfg.shop_info) try { setShopInfo(JSON.parse(cfg.shop_info)) } catch (_) {}
      if (cfg.qr_image) setQrImage(cfg.qr_image)
      if (cfg.display_order) try { setOrder(JSON.parse(cfg.display_order)) } catch (_) {}
    })
    const ch = supabase.channel('customer-display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_config' }, payload => {
        const key = payload.new?.key
        const val = payload.new?.value
        if (key === 'display_order') { try { setOrder(JSON.parse(val)) } catch (_) {} }
        else if (key === 'qr_image') setQrImage(val)
        else if (key === 'shop_info') { try { setShopInfo(JSON.parse(val)) } catch (_) {} }
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const hasOrder = order.items && order.items.length > 0

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center select-none px-8 py-10" style={{ background: 'var(--brown)' }}>
      <div className="font-serif font-black text-center mb-8" style={{ fontSize: 'clamp(24px,4vw,42px)', color: 'var(--cream)' }}>
        {shopInfo.name}
      </div>

      {!hasOrder ? (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="font-black" style={{ fontSize: 'clamp(18px,2.4vw,28px)', color: 'rgba(253,246,238,0.7)' }}>
            ສະແກນເພື່ອຊຳລະເງິນ · Scan to Pay
          </div>
          {qrImage ? (
            <img src={qrImage} alt="QR ຊຳລະເງິນ" className="rounded-2xl" style={{ width: 'min(60vw, 420px)', background: '#fff', padding: 16 }} />
          ) : (
            <div className="text-sm font-bold" style={{ color: 'rgba(253,246,238,0.4)' }}>ຍັງບໍ່ໄດ້ອັບໂຫລດ QR</div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-3xl grid gap-8" style={{ gridTemplateColumns: qrImage ? '1.3fr 1fr' : '1fr' }}>
          <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--warm-white)' }}>
            <div className="px-6 py-4 text-xs font-black tracking-widest uppercase" style={{ background: 'var(--cream2)', color: 'var(--gray3)' }}>
              ລາຍການ · Your Order
            </div>
            <div className="px-6 py-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between py-3 border-b border-[#f5ebe0]" style={{ fontSize: 'clamp(16px,2vw,22px)' }}>
                  <span className="font-bold" style={{ color: 'var(--brown)' }}>{it.name} × {it.qty}</span>
                  <span className="font-black" style={{ color: 'var(--brown)' }}>{(it.sub || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-5 flex justify-between items-center" style={{ background: '#3d1f0a' }}>
              <span className="font-black tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.6)', fontSize: 'clamp(12px,1.4vw,16px)' }}>ລວມ · TOTAL</span>
              <span className="font-serif font-black" style={{ color: 'var(--cream)', fontSize: 'clamp(28px,4vw,48px)' }}>{(order.total || 0).toLocaleString()} ກີບ</span>
            </div>
          </div>
          {qrImage && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl p-6" style={{ background: 'var(--warm-white)' }}>
              <div className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--gray3)' }}>ສະແກນຊຳລະ</div>
              <img src={qrImage} alt="QR" className="rounded-xl" style={{ width: '100%', maxWidth: 260 }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
