'use client'

export const DEFAULT_HAIR_CLIP_CONFIG = {
  enabled: false,
  discountThreshold: 100000,
  discountAmount: 5000,
  types: [{ id: 1, name: 'ກິ໊ບທຳມະດາ', price: 20000 }],
}

export function calcHairClip(config, selections = {}, foodTotal = 0) {
  if (!config?.enabled || !config?.types?.length) return { subtotal: 0, discountAmt: 0 }
  const rawTotal = config.types.reduce((s, t) => s + (selections[t.id] || 0) * t.price, 0)
  const totalQty = Object.values(selections).reduce((s, v) => s + v, 0)
  const discountAmt = totalQty > 0 && foodTotal >= (config.discountThreshold ?? 100000)
    ? (config.discountAmount ?? 5000) : 0
  return { subtotal: rawTotal - discountAmt, discountAmt }
}

export default function HairClipAddon({ config, selections = {}, onChange, foodTotal = 0 }) {
  if (!config?.enabled || !config?.types?.length) return null

  const { subtotal, discountAmt } = calcHairClip(config, selections, foodTotal)
  const hasDiscount = foodTotal >= (config.discountThreshold ?? 100000)
  const totalQty = Object.values(selections).reduce((s, v) => s + v, 0)

  function setQty(typeId, qty) {
    const next = { ...selections }
    if (qty <= 0) delete next[typeId]
    else next[typeId] = qty
    onChange(next)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden border-2 transition-all"
      style={{ borderColor: totalQty > 0 ? 'var(--brown)' : '#e8d5c0', background: 'var(--warm-white)' }}
    >
      {hasDiscount && (
        <div className="px-4 py-2 text-center text-xs font-black" style={{ background: '#f59e0b', color: 'white' }}>
          🎉 ຊື້ຄົບ {(config.discountThreshold ?? 100000).toLocaleString()} ກີບ — ສ່ວນລົດ {(config.discountAmount ?? 5000).toLocaleString()} ກີບ ເມື່ອຊື້ກິ໊ບ!
        </div>
      )}

      <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-[#e8d5c0]">
        <span className="text-base">🎀</span>
        <span className="font-black text-sm" style={{ color: 'var(--brown)' }}>ກິ໊ບຫນີບຜົມ · Hair Clips</span>
        {hasDiscount && (
          <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#d97706' }}>
            -{(config.discountAmount ?? 5000).toLocaleString()} ກີບ
          </span>
        )}
      </div>

      <div className="flex flex-col divide-y divide-[#f5ebe0]">
        {config.types.map(t => {
          const qty = selections[t.id] || 0
          const displayPrice = hasDiscount && config.types.length === 1
            ? t.price - (config.discountAmount ?? 5000)
            : t.price
          return (
            <div key={t.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: 'var(--brown)' }}>{t.name}</div>
                {hasDiscount && config.types.length === 1 ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-black" style={{ color: '#d97706' }}>{displayPrice.toLocaleString()} ກີບ</span>
                    <span className="text-xs font-bold line-through" style={{ color: 'var(--gray3)' }}>{t.price.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>{t.price.toLocaleString()} ກີບ / ອັນ</div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setQty(t.id, qty - 1)}
                  disabled={qty === 0}
                  className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg font-black transition-all"
                  style={{ borderColor: qty === 0 ? '#e8d5c0' : 'var(--brown)', color: qty === 0 ? '#e8d5c0' : 'var(--brown)', background: 'var(--warm-white)' }}
                >−</button>
                <span className="font-black text-lg w-6 text-center" style={{ color: 'var(--brown)' }}>{qty}</span>
                <button
                  onClick={() => setQty(t.id, qty + 1)}
                  className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg font-black active:scale-95 transition-all"
                  style={{ borderColor: 'var(--brown)', color: 'var(--brown)', background: 'var(--warm-white)' }}
                >+</button>
              </div>
            </div>
          )
        })}
      </div>

      {totalQty > 0 && (
        <div className="px-4 py-2 flex justify-between items-center" style={{ background: 'var(--cream2)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>ກິ໊ບ ×{totalQty}</span>
          <span className="text-sm font-black" style={{ color: 'var(--brown)' }}>
            {subtotal.toLocaleString()} ກີບ
            {discountAmt > 0 && (
              <span className="text-xs font-bold ml-1.5" style={{ color: '#16a34a' }}>
                (-{discountAmt.toLocaleString()})
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
