'use client'

const PRICE = 20000
const DISCOUNT_THRESHOLD = 100000
const DISCOUNT = 5000

export { PRICE as HAIR_CLIP_PRICE, DISCOUNT_THRESHOLD as HAIR_CLIP_DISCOUNT_THRESHOLD, DISCOUNT as HAIR_CLIP_DISCOUNT }

export default function HairClipAddon({ foodTotal = 0, qty = 0, onChange }) {
  const hasDiscount = foodTotal >= DISCOUNT_THRESHOLD
  const discountAmt = hasDiscount && qty > 0 ? DISCOUNT : 0
  const subtotal = qty * PRICE - discountAmt

  return (
    <div
      className="rounded-2xl overflow-hidden border-2 transition-all"
      style={{ borderColor: qty > 0 ? 'var(--brown)' : '#e8d5c0', background: 'var(--warm-white)' }}
    >
      {hasDiscount && (
        <div className="px-4 py-2 text-center text-xs font-black" style={{ background: '#f59e0b', color: 'white' }}>
          🎉 ຊື້ຄົບ {DISCOUNT_THRESHOLD.toLocaleString()} ກີບ — ສ່ວນລົດ {DISCOUNT.toLocaleString()} ກີບ ເມື່ອຊື້ກິ໊ບ!
        </div>
      )}

      <div className="px-4 py-3 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
          style={{ background: 'var(--cream2)' }}
        >
          🎀
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-black text-sm" style={{ color: 'var(--brown)' }}>ກິ໊ບຫນີບຜົມ · Hair Clip</div>
          {hasDiscount ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-black" style={{ color: '#d97706' }}>
                {(PRICE - DISCOUNT).toLocaleString()} ກີບ
              </span>
              <span className="text-xs font-bold line-through" style={{ color: 'var(--gray3)' }}>
                {PRICE.toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>
              {PRICE.toLocaleString()} ກີບ / ອັນ
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onChange(Math.max(0, qty - 1))}
            disabled={qty === 0}
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg font-black transition-all"
            style={{
              borderColor: qty === 0 ? '#e8d5c0' : 'var(--brown)',
              color: qty === 0 ? '#e8d5c0' : 'var(--brown)',
              background: 'var(--warm-white)',
            }}
          >−</button>
          <span className="font-black text-lg w-6 text-center" style={{ color: 'var(--brown)' }}>{qty}</span>
          <button
            onClick={() => onChange(qty + 1)}
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg font-black active:scale-95 transition-all"
            style={{ borderColor: 'var(--brown)', color: 'var(--brown)', background: 'var(--warm-white)' }}
          >+</button>
        </div>
      </div>

      {qty > 0 && (
        <div className="px-4 py-2 border-t border-[#e8d5c0] flex justify-between items-center" style={{ background: 'var(--cream2)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>ກິ໊ບ ×{qty}</span>
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
