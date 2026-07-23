'use client'

export default function ChatMessage({ msg }) {
  const isCustomer = msg.role === 'customer'
  const timeStr = new Date(msg.ts).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] ${isCustomer ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isCustomer && msg.orderId && (
          <span style={{ fontSize: 10, color: '#5C4033', letterSpacing: 1 }} className="font-bold uppercase px-1">
            #{msg.orderId}
          </span>
        )}
        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={
            isCustomer
              ? { background: '#2E1C12', color: '#fff', borderBottomRightRadius: 4 }
              : { background: '#F0E5D8', color: '#2E1C12', borderBottomLeftRadius: 4 }
          }
        >
          {msg.text}
        </div>
        <span style={{ fontSize: 10, color: '#9E7B6A' }} className="px-1">{timeStr}</span>
      </div>
    </div>
  )
}
