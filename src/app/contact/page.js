'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const DEFAULT_BRANCHES = [
  {
    id: 'simeuang',
    name: 'ສາຂາສີເມື່ອງ',
    nameEn: 'Si Meuang Branch',
    visible: true,
    schedule: 'ຈ · ພ · ສ (Mon / Wed / Fri)',
    mapUrl: '',
    facebookUrl: '',
    tiktokUrl: '',
    phone1: '',
    phone2: '',
    whatsapp: '',
  },
  {
    id: 'houayhong',
    name: 'ສາຂາຫວຍຫົງ',
    nameEn: 'Houay Hong Branch',
    visible: true,
    schedule: 'ຄ · ສກ · ອ (Tue / Thu / Sat)',
    mapUrl: '',
    facebookUrl: '',
    tiktokUrl: '',
    phone1: '',
    phone2: '',
    whatsapp: '',
  },
]

function IconMap() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  )
}
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  )
}
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}
function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  )
}
function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function ContactPage() {
  const [branches, setBranches] = useState([])
  const [shopInfo, setShopInfo] = useState({ name: 'Basic Chinese Bun' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('shop_config').select('*')
      if (data) {
        const cfg = {}
        data.forEach(r => { cfg[r.key] = r.value })
        if (cfg.branches) setBranches(JSON.parse(cfg.branches))
        else setBranches(DEFAULT_BRANCHES)
        if (cfg.shop_info) setShopInfo(JSON.parse(cfg.shop_info))
      } else {
        setBranches(DEFAULT_BRANCHES)
      }
      setLoading(false)
    }
    load()
  }, [])

  const visibleBranches = branches.filter(b => b.visible)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ background: 'var(--brown)' }}>
        <button onClick={() => window.history.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
          style={{ background: 'rgba(253,246,238,0.15)', color: 'var(--cream)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="flex-1 text-center">
          <div className="font-serif text-lg font-black" style={{ color: 'var(--cream)' }}>{shopInfo.name}</div>
          <div className="text-xs tracking-widest uppercase" style={{ color: 'rgba(253,246,238,0.55)' }}>
            ຂໍ້ມູນ & ສາຂາ · Shop Info
          </div>
        </div>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-5">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-sm font-bold" style={{ color: 'var(--gray3)' }}>ກຳລັງໂຫຼດ...</div>
          </div>
        ) : visibleBranches.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-sm font-bold text-center" style={{ color: 'var(--gray3)' }}>
              ຍັງບໍ່ມີຂໍ້ມູນສາຂາ<br/>ກະລຸນາຕິດຕໍ່ທາງຮ້ານໂດຍກົງ
            </div>
          </div>
        ) : (
          visibleBranches.map((b) => {
            const waUrl = b.whatsapp
              ? `https://wa.me/${b.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('ສະບາຍດີ! ຂ້ອຍຕ້ອງການສອບຖາມຂໍ້ມູນ')}`
              : '#'

            return (
              <div key={b.id} className="rounded-3xl overflow-hidden shadow-lg" style={{ border: '2px solid var(--cream3)' }}>

                {/* Branch header */}
                <div className="px-5 py-5" style={{ background: 'var(--brown)' }}>
                  <div className="font-serif text-2xl font-black" style={{ color: 'var(--cream)' }}>{b.name}</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: 'rgba(253,246,238,0.65)' }}>{b.nameEn}</div>
                  {b.schedule && (
                    <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-black"
                      style={{ background: 'rgba(253,246,238,0.15)', color: 'var(--cream)' }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                      </svg>
                      {b.schedule}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="p-4 flex flex-col gap-3" style={{ background: 'var(--warm-white)' }}>

                  {/* Maps */}
                  {b.mapUrl && (
                    <a href={b.mapUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl active:scale-95 transition-all"
                      style={{ background: '#4285F4', textDecoration: 'none' }}>
                      <span className="text-white"><IconMap /></span>
                      <div>
                        <div className="font-black text-sm text-white">Google Maps</div>
                        <div className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>ເບິ່ງທີ່ຕັ້ງ</div>
                      </div>
                    </a>
                  )}

                  {/* Social row */}
                  {(b.facebookUrl || b.tiktokUrl) && (
                    <div className="grid grid-cols-2 gap-2">
                      {b.facebookUrl && (
                        <a href={b.facebookUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl active:scale-95 transition-all"
                          style={{ background: '#1877F2', textDecoration: 'none' }}>
                          <span className="text-white"><IconFacebook /></span>
                          <div>
                            <div className="font-black text-sm text-white">Facebook</div>
                            <div className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>ໜ້າຮ້ານ</div>
                          </div>
                        </a>
                      )}
                      {b.tiktokUrl && (
                        <a href={b.tiktokUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl active:scale-95 transition-all"
                          style={{ background: '#010101', textDecoration: 'none' }}>
                          <span className="text-white"><IconTikTok /></span>
                          <div>
                            <div className="font-black text-sm text-white">TikTok</div>
                            <div className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>ວິດີໂອ</div>
                          </div>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Phone numbers */}
                  {(b.phone1 || b.phone2) && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid var(--cream3)' }}>
                      {[b.phone1, b.phone2].filter(Boolean).map((num, pi) => (
                        <a key={pi} href={`tel:${num.replace(/\s/g, '')}`}
                          className={`flex items-center gap-3 px-4 py-3.5 active:bg-[#f5ebe0] transition-colors ${pi > 0 ? 'border-t border-[#e8d5c0]' : ''}`}
                          style={{ textDecoration: 'none', display: 'flex', background: 'var(--warm-white)' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--cream2)', color: 'var(--brown)' }}>
                            <IconPhone />
                          </div>
                          <div className="flex-1">
                            <div className="font-black text-base" style={{ color: 'var(--brown)' }}>{num}</div>
                            <div className="text-xs font-bold" style={{ color: 'var(--gray3)' }}>ກົດເພື່ອໂທ</div>
                          </div>
                          <div className="text-xs font-black px-3 py-1.5 rounded-xl"
                            style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
                            ໂທ
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* WhatsApp */}
                  {b.whatsapp && (
                    <a href={waUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
                      style={{ background: '#25D366', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 14px rgba(37,211,102,0.3)' }}>
                      <IconWhatsApp />
                      ສົ່ງຂໍ້ຄວາມ WhatsApp
                    </a>
                  )}

                  {/* Placeholder hint when all fields empty */}
                  {!b.mapUrl && !b.facebookUrl && !b.tiktokUrl && !b.phone1 && !b.phone2 && !b.whatsapp && (
                    <div className="text-center py-4 text-sm font-bold" style={{ color: 'var(--cream3)' }}>
                      ຍັງບໍ່ໄດ້ຕັ້ງຄ່າຂໍ້ມູນຕິດຕໍ່
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
