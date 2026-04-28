// Shown on order status screens — links to the full /contact page
export default function ContactSection() {
  return (
    <div className="w-full max-w-sm mx-auto mt-5">
      <a href="/contact"
        className="flex items-center gap-4 px-5 py-4 rounded-2xl active:scale-95 transition-all"
        style={{
          background: 'var(--warm-white)',
          border: '2px solid var(--cream3)',
          boxShadow: '0 2px 12px rgba(61,31,10,0.07)',
          textDecoration: 'none',
        }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="font-black text-base" style={{ color: 'var(--brown)' }}>ຂໍ້ມູນ & ສາຂາ</div>
          <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>
            ແຜນທີ່ · ໂທ · WhatsApp · Social
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--cream3)' }}>
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
        </svg>
      </a>
    </div>
  )
}
