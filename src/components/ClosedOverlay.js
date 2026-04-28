export default function ClosedOverlay({ shopInfo = {}, branches = [], subtitle = '' }) {
  const firstBranch = branches.find(b => b.visible)
  const waUrl = firstBranch?.whatsapp
    ? `https://wa.me/${firstBranch.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('ສະບາຍດີ! ຂ້ອຍຢາກສອບຖາມຂໍ້ມູນ')}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: 'var(--cream)' }}>

      {/* Brown header */}
      <div className="text-center px-6 pt-10 pb-8 flex-shrink-0" style={{ background: 'var(--brown)' }}>
        {shopInfo.logo ? (
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 border-2" style={{ borderColor: 'rgba(253,246,238,0.25)' }}>
            <img src={shopInfo.logo} className="w-full h-full object-cover" alt="logo" />
          </div>
        ) : (
          <div className="text-5xl mb-4">🥟</div>
        )}
        <div className="font-serif text-2xl font-black" style={{ color: 'var(--cream)' }}>
          {shopInfo.name || 'Basic Chinese Bun'}
        </div>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--cream)' }}>
          🚫 ຮ້ານປິດຊົ່ວຄາວ
        </div>
      </div>

      {/* Closed message */}
      <div className="px-5 pt-7 pb-5 text-center">
        <div className="font-black leading-snug" style={{ fontSize: 22, color: 'var(--brown)' }}>
          ຕອນນີ້ປິດຮ້ານຢູ່
        </div>
        <div className="font-bold text-base mt-2" style={{ color: 'var(--brown2)' }}>
          ສາມາດຕິດຕໍ່ໄດ້ທີ່:
        </div>
        {subtitle ? (
          <div className="text-xs font-bold mt-1.5 px-4 py-1 rounded-full inline-block" style={{ background: 'var(--cream2)', color: 'var(--gray3)' }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* Contact cards */}
      <div className="px-5 pb-10 flex flex-col gap-3 max-w-sm mx-auto w-full">

        {/* Address */}
        {shopInfo.address ? (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: 'var(--warm-white)', border: '2px solid var(--cream3)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--cream2)', color: 'var(--brown)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div className="flex-1 text-sm font-bold leading-snug" style={{ color: 'var(--brown)' }}>{shopInfo.address}</div>
          </div>
        ) : null}

        {/* Phone */}
        {shopInfo.phone ? (
          <a href={`tel:${shopInfo.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl active:scale-95 transition-all"
            style={{ background: 'var(--warm-white)', border: '2px solid var(--cream3)', textDecoration: 'none' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--cream2)', color: 'var(--brown)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-black" style={{ color: 'var(--brown)' }}>{shopInfo.phone}</div>
              <div className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>ກົດເພື່ອໂທ</div>
            </div>
            <div className="text-xs font-black px-3 py-1.5 rounded-xl"
              style={{ background: 'var(--brown)', color: 'var(--cream)' }}>ໂທ</div>
          </a>
        ) : null}

        {/* Facebook + TikTok */}
        {firstBranch && (firstBranch.facebookUrl || firstBranch.tiktokUrl) ? (
          <div className={`grid gap-2 ${firstBranch.facebookUrl && firstBranch.tiktokUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {firstBranch.facebookUrl ? (
              <a href={firstBranch.facebookUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl active:scale-95 transition-all"
                style={{ background: '#1877F2', textDecoration: 'none' }}>
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 flex-shrink-0">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-black text-sm text-white">Facebook</span>
              </a>
            ) : null}
            {firstBranch.tiktokUrl ? (
              <a href={firstBranch.tiktokUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl active:scale-95 transition-all"
                style={{ background: '#010101', textDecoration: 'none' }}>
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 flex-shrink-0">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                <span className="font-black text-sm text-white">TikTok</span>
              </a>
            ) : null}
          </div>
        ) : null}

        {/* WhatsApp */}
        {waUrl ? (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
            style={{ background: '#25D366', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(37,211,102,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            ສົ່ງຂໍ້ຄວາມ WhatsApp
          </a>
        ) : null}

        {/* Link to full contact page */}
        <a href="/contact"
          className="flex items-center gap-4 px-5 py-4 rounded-2xl active:scale-95 transition-all mt-1"
          style={{ background: 'var(--warm-white)', border: '2px solid var(--cream3)', textDecoration: 'none' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-black text-base" style={{ color: 'var(--brown)' }}>ຂໍ້ມູນ & ສາຂາ</div>
            <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--gray3)' }}>ແຜນທີ່ · ໂທ · WhatsApp · Social</div>
          </div>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--cream3)' }}>
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
          </svg>
        </a>

      </div>
    </div>
  )
}
