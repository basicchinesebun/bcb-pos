'use client'
import { useState } from 'react'

const PALETTE = [
  '#7B3F00', '#1B4F2A', '#1A2D5A', '#4a1942',
  '#2d4a1a', '#5c2d00', '#1a3d4a', '#3d1f4a',
]

export default function PreorderV2Page() {
  const [ready, setReady] = useState(true)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF2E7', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        background: '#2E1C12',
        padding: '48px 24px 52px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        textAlign: 'center',
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid rgba(253,246,238,.2)',
        }}>
          <img src="/logo.jpg" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ color: '#FAF2E7', fontWeight: 900, fontSize: '1.5rem' }}>
            Basic Chinese Bun
          </div>
          <div style={{ color: 'rgba(253,246,238,.5)', fontSize: '.88rem', marginTop: 6 }}>
            ສາລາເປົາ · ໝົມປັງໂຕ · ສົດໃໝ່ທຸກວັນ
          </div>
        </div>
      </div>

      <svg viewBox="0 0 400 32" style={{ display: 'block', background: '#2E1C12', marginBottom: -1 }}>
        <path d="M0,0 Q100,32 200,16 Q300,0 400,24 L400,32 L0,32Z" fill="#FAF2E7" />
      </svg>

      <div style={{ padding: '32px 20px 20px' }}>
        <p style={{ fontWeight: 900, fontSize: '1.1rem', color: '#2E1C12', marginBottom: 6 }}>
          ເລືອກໄດ້ຫຼາຍຮົດ 🥟
        </p>
        <p style={{ fontSize: '.82rem', color: '#9E7B6A', marginBottom: 28 }}>
          ເລື່ອນເບິ່ງເມນູທັງໝົດ {ready ? '' : ''}
        </p>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {['ເປົາໝ', 'ເປົາ', 'ໝົມ', 'ໝົມ'].map((m, i) => (
            <div key={i} style={{
              flexShrink: 0,
              width: 150, height: 200,
              borderRadius: 20,
              background: PALETTE[i],
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,.72) 40%, transparent 70%)',
              }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 14px 16px' }}>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: '.88rem' }}>{m}</div>
                <div style={{ color: '#FFD87A', fontWeight: 800, fontSize: '.78rem' }}>15,000 ກີບ</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 20px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <a href="/preorder" style={{
          display: 'block', background: '#00A859', color: '#fff',
          fontWeight: 900, fontSize: '1rem', textAlign: 'center',
          padding: '17px 0', borderRadius: 99, textDecoration: 'none',
        }}>
          ສັ່ງດ່ວນ →
        </a>
      </div>

      <div style={{
        background: '#2E1C12', color: 'rgba(253,246,238,.4)',
        textAlign: 'center', padding: '20px', fontSize: '.75rem',
      }}>
        Basic Chinese Bun · ວຽງຈັນ, ລາວ
      </div>
    </div>
  )
}
