'use client'

const STATUS_COLORS = { active: '#00A859', unread: '#F59E0B', closed: '#9E7B6A' }
const STATUS_LABEL = { active: 'Active', unread: 'ยังไม่อ่าน', closed: 'ปิดแล้ว' }

export default function ChatList({ conversations, selectedId, onSelect, filter, onFilterChange }) {
  const filtered = filter === 'all' ? conversations : conversations.filter(c => c.status === filter)

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF2E7' }}>
      {/* Search */}
      <div className="p-3 border-b" style={{ borderColor: '#E8D5C0' }}>
        <input
          placeholder="ค้นหาลูกค้า..."
          className="w-full rounded-xl px-3 py-2 text-sm outline-none border"
          style={{ borderColor: '#E8D5C0', background: '#fff', color: '#2E1C12' }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-3 py-2 border-b overflow-x-auto" style={{ borderColor: '#E8D5C0' }}>
        {['all', 'active', 'unread', 'closed'].map(f => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors"
            style={
              filter === f
                ? { background: '#2E1C12', color: '#fff' }
                : { background: '#F0E5D8', color: '#5C4033' }
            }
          >
            {f === 'all' ? 'ทั้งหมด' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="w-full text-left px-4 py-3 flex items-start gap-3 border-b transition-colors"
            style={{
              borderColor: '#E8D5C0',
              background: selectedId === c.id ? '#F0E5D8' : 'transparent',
            }}
          >
            {/* Avatar */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm"
              style={{ background: '#2E1C12' }}
            >
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm truncate" style={{ color: '#2E1C12' }}>{c.name}</span>
                <span style={{ fontSize: 10, color: '#9E7B6A' }}>{c.time}</span>
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: '#5C4033' }}>{c.lastMsg}</p>
            </div>
            {/* Status dot */}
            {c.unread > 0 && (
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-white text-xs font-black flex items-center justify-center"
                style={{ background: STATUS_COLORS.unread }}
              >
                {c.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
