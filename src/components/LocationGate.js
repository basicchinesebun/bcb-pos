'use client'
import { useState } from 'react'

export default function LocationGate({ onDone }) {
  const [state, setState] = useState('idle') // idle | loading | denied | done

  async function requestLocation() {
    setState('loading')
    if (!navigator.geolocation) {
      setState('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        try {
          localStorage.setItem('bcb-location', JSON.stringify({
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            ts: Date.now(),
            ua: navigator.userAgent,
          }))
        } catch (_) {}
        onDone({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setState('denied')
      },
      { timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: '#2E1C12' }}
    >
      {/* Logo area */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 shadow-xl"
        style={{ background: '#FAF2E7' }}
      >
        🥟
      </div>

      <p className="font-black text-2xl text-white mb-2 text-center">Basic Chinese Bun</p>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 mt-4 flex flex-col gap-4"
        style={{ background: '#FAF2E7' }}
      >
        {state !== 'denied' ? (
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
