'use client'
import { ShoppingBag, Plus } from 'lucide-react'

export default function CustomerPanel({ customer, aiOn, onToggleAi }) {
  if (!customer) return (
    <div className="flex items-center justify-center h-full text-sm" style={{ color: '#9E7B6A' }}>
      เลือกแชตก่อน
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4" style={{ background: '#FAF2E7' }}>
      {/* Profile */}
      <div className="rounded-xl p-4 flex flex-col items-center gap-2" style={{ background: '#F0E5D8' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl"
          style={{ background: '#2E1C12' }}
        >
          {customer.name.charAt(0)}
        </div>
        <p className="font-black text-base" style={{ color: '#2E1C12' }}>{customer.name}</p>
        <p className="text-xs" style={{ color: '#5C4033' }}>{customer.phone}</p>
        {/* AI toggle */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-bold" style={{ color: '#5C4033' }}>AI ตอบแทน</span>
          <button
            onClick={onToggleAi}
            className="relative w-10 h-5 rounded-full transition-colors"
            style={{ background: aiOn ? '#00A859' : '#E8D5C0' }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: aiOn ? '22px' : '2px' }}
            />
          </button>
          {aiOn && (
            <span className="text-xs font-black rounded-full px-2 py-0.5" style={{ background: '#00A859', color: '#fff' }}>
              ON
            </span>
          )}
        </div>
      </div>

      {/* Order History */}
      <div>
        <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: '#9E7B6A' }}>
          ออเดอร์ล่าสุด
        </p>
        <div className="flex flex-col gap-2">
          {customer.orders.map(o => (
            <div key={o.id} className="rounded-xl p-3" style={{ background: '#F0E5D8' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black" style={{ color: '#2E1C12' }}>#{o.id}</span>
                <span
                  className="text-xs font-bold rounded-full px-2 py-0.5"
                  style={{
                    background: o.status === 'done' ? '#00A859' : '#F59E0B',
                    color: '#fff',
                  }}
                >
                  {o.status === 'done' ? 'สำเร็จ' : 'รอดำเนินการ'}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: '#5C4033' }}>{o.items}</p>
              <p className="text-xs font-black mt-1" style={{ color: '#2E1C12' }}>{o.total.toLocaleString()} ກີບ</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <button
        className="flex items-center justify-center gap-2 rounded-xl py-3 font-black text-sm"
        style={{ background: '#2E1C12', color: '#fff' }}
      >
        <Plus size={16} />
        สร้างออเดอร์ใหม่
      </button>
    </div>
  )
}
