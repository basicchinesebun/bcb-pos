'use client'

export default function QuickReplyChip({ label, onClick }) {
  return (
    <button
      onClick={() => onClick(label)}
      className="flex-shrink-0 rounded-full border text-xs font-bold px-3 py-1.5 transition-colors"
      style={{ borderColor: '#2E1C12', color: '#2E1C12', background: '#FAF2E7' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#2E1C12'; e.currentTarget.style.color = '#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#FAF2E7'; e.currentTarget.style.color = '#2E1C12' }}
    >
      {label}
    </button>
  )
}
