'use client'
import { useState } from 'react'

function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/\d|KAKAOTALK|MicroMessenger/.test(ua)
}

export default function LocationGate({ onDone }) {
  const [state, setState] = useState(() => detectInAppBrowser() ? 'inapp' : 'idle')

  async function requestLocation() {
    setState('loading')
    if (!navigator.geolocation) {
      setState('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const gps = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        }

        // Fetch IP info in parallel — don't block if it fails
        let ipInfo = null
        try {
          const res = await fetch('https://ipapi.co/json/')
          const d = await res.json()
          ipInfo = {
            ip: d.ip,
            country: d.country_name,
            country_code: d.country_code,
            city: d.city,
            org: d.org,
            timezone: d.timezone,
          }
        } catch (_) {}

        const security = {
          gps,
          ip: ipInfo,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          lang: navigator.language,
          ua: navigator.userAgent,
          ts: Date.now(),
        }

        try { localStorage.setItem('bcb-security', JSON.stringify(security)) } catch (_) {}
        onDone(security)
      },
      () => setState('denied'),
      { timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: '#2E1C12' }}
    >
      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-xl flex-shrink-0">
        <img src="/logo.jpg" alt="Basic Chinese Bun" className="w-full h-full object-cover" />
      </div>

      <div
        className="w-full max-w-sm rounded-2xl p-6 mt-4 flex flex-col gap-4"
        style={{ background: '#FAF2E7' }}
      >
        {state === 'inapp' ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">🌐</span>
            <p className="font-black text-lg" style={{ color: '#2E1C12' }}>
              ກະລຸນາເປີດໃນ Chrome ຫຼື Safari
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#5C4033' }}>
              ກະລຸນາກ໋ອບປີ້ລິ້ງດ້ານລຸ່ມ ແລ້ວໄປເປີດໃນແອັບ Chrome ຫຼື Safari ຈາກນັ້ນວາງລິ້ງໃນຊ່ອງຊອກຫາໄດ້ເລີຍ
            </p>
            <div
              className="w-full rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
              style={{ background: '#F0E5D8', border: '1.5px solid #E8D5C0' }}
            >
              <span className="text-xs font-black truncate flex-1 text-left" style={{ color: '#2E1C12' }}>
                basicchinesebun.com/preorder
              </span>
              <button
                onClick={() => { try { navigator.clipboard.writeText('https://basicchinesebun.com/preorder') } catch (_) {} }}
                className="text-xs font-black px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: '#2E1C12', color: '#FAF2E7' }}
              >
                ກ໋ອບປີ້
              </button>
            </div>
          </div>
        ) : state !== 'denied' ? (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">📍</span>
              <p className="font-black text-lg" style={{ color: '#2E1C12' }}>
                ຂໍອະນຸຍາດທີ່ຕັ້ງ
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#5C4033' }}>
                ເພື່ອຄວາມປອດໄພ ແລະ ການຢືນຢັນການສັ່ງ ກະລຸນາອະນຸຍາດ ໃຫ້ລະບົບເຂົ້າເຖິງທີ່ຕັ້ງຂອງທ່ານ
              </p>
            </div>

            <button
              onClick={requestLocation}
              disabled={state === 'loading'}
              className="w-full py-3.5 rounded-xl font-black text-white text-sm transition-all active:scale-95"
              style={{
                background: state === 'loading' ? '#9E7B6A' : '#00A859',
                opacity: state === 'loading' ? 0.7 : 1,
              }}
            >
              {state === 'loading' ? 'ກຳລັງດຶງທີ່ຕັ້ງ...' : '📍 ອະນຸຍາດທີ່ຕັ້ງ'}
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="font-black text-lg" style={{ color: '#2E1C12' }}>
                ບໍ່ສາມາດດຶງທີ່ຕັ້ງໄດ້
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#5C4033' }}>
                ກະລຸນາໄປທີ່ ຕັ້ງຄ່າ &gt; ຄວາມເປັນສ່ວນຕົວ &gt; ທີ່ຕັ້ງ ແລ້ວ ອະນຸຍາດ ສຳລັບ Safari / Chrome ຈາກນັ້ນກັບມາລອງໃໝ່
              </p>
            </div>

            <button
              onClick={requestLocation}
              className="w-full py-3.5 rounded-xl font-black text-white text-sm transition-all active:scale-95"
              style={{ background: '#2E1C12' }}
            >
              🔄 ລອງໃໝ່
            </button>
          </>
        )}
      </div>
    </div>
  )
}
