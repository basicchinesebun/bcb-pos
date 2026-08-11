export const metadata = {
  title: 'Dark Chocolate — Basic Chinese Bun',
  description: 'ໝັນໂຖ Dark Chocolate — ຊັອກໂກແລດແທ້ 100%',
}

export default function DarkChocolatePage() {
  return (
    <div className="dc-page">
      <style>{`
        .dc-page{
          position:relative; min-height:100dvh; overflow:hidden;
          background-color:#1a0d06;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:clamp(16px,4vh,32px) clamp(16px,5vw,28px);
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
        }
        .dc-header{
          position:absolute; top:0; left:0; right:0; z-index:100;
          display:flex; align-items:center; gap:10px;
          padding:clamp(14px,3vh,20px) clamp(16px,5vw,28px);
        }
        .dc-header img{ width:30px; height:30px; border-radius:50%; object-fit:cover }
        .dc-header span{ color:#fdf6ee; font-weight:900; letter-spacing:.04em; font-size:.95rem }

        .dc-stage{
          position:relative; width:min(420px,86vw); margin:0 auto; height:0;
          padding-top:64.94%; /* 1024x950 canvas, padding-top hack for Safari-safe aspect ratio */
        }
        .dc-stage-inner{ position:absolute; inset:0; overflow:hidden; border-radius:18px }
        .dc-layer{ position:absolute; inset:0; width:100%; height:100%; display:block; pointer-events:none; user-select:none }

        @keyframes dcGhostDrift{ 0%,100%{ transform:translateY(0); opacity:.88 } 50%{ transform:translateY(-5px); opacity:1 } }
        @keyframes dcPatternDrift{ 0%,100%{ transform:translate(0,0) } 50%{ transform:translate(2px,-3px) } }
        @keyframes dcGlowPulse{ 0%,100%{ opacity:.92 } 50%{ opacity:1 } }
        @keyframes dcShadowPulse{ 0%,100%{ transform:scale(1.02) } 50%{ transform:scale(.98) } }
        @keyframes dcBackFloat{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-6px) } }
        @keyframes dcPowderDrift{ 0%,100%{ transform:translate(0,0) } 50%{ transform:translate(-3px,2px) } }
        @keyframes dcBunFloat{ 0%,100%{ transform:translateY(0) rotate(-.5deg) } 50%{ transform:translateY(-4px) rotate(.5deg) } }
        @keyframes dcFrontFloat{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-9px) } }
        @keyframes dcParticlesDrift{ 0%,100%{ transform:translate(0,0); opacity:.85 } 50%{ transform:translate(2px,-4px); opacity:1 } }
        @keyframes dcSteamRise{ 0%{ transform:translateY(0); opacity:0 } 25%{ opacity:.8 } 100%{ transform:translateY(-16px); opacity:0 } }

        .dc-ghost{ animation:dcGhostDrift 7s ease-in-out infinite }
        .dc-pattern-layer{ animation:dcPatternDrift 16s ease-in-out infinite }
        .dc-glow{ animation:dcGlowPulse 4s ease-in-out infinite }
        .dc-shadow{ animation:dcShadowPulse 4s ease-in-out infinite }
        .dc-choc-back{ animation:dcBackFloat 7.5s ease-in-out infinite }
        .dc-powder{ animation:dcPowderDrift 9s ease-in-out infinite }
        .dc-bun{ animation:dcBunFloat 4s ease-in-out infinite }
        .dc-choc-front{ animation:dcFrontFloat 5.2s ease-in-out infinite }
        .dc-particles{ animation:dcParticlesDrift 6s ease-in-out infinite }
        .dc-steam{ animation:dcSteamRise 4.5s ease-in-out infinite }

        .dc-label{ width:min(420px,86vw); margin:22px auto 0; text-align:left }
        .dc-premium-badge{
          display:inline-flex; align-items:center; gap:5px;
          padding:5px 14px; margin-bottom:9px; border-radius:99px;
          border:1px solid rgba(217,136,140,.55);
          background:rgba(217,136,140,.1);
          color:#D9888C; font-size:.65rem; font-weight:800;
          letter-spacing:.14em; text-transform:uppercase;
        }
        .dc-name-row{ display:flex; align-items:flex-end; justify-content:space-between; gap:10px }
        .dc-name{ color:#fff; font-size:clamp(1.3rem,5.5vw,1.7rem); font-weight:900; line-height:1.25 }
        .dc-price{ color:rgba(255,255,255,.7); font-size:clamp(1.15rem,4.5vw,1.4rem); font-weight:900; font-family:Georgia,serif; text-align:right; line-height:1.1; flex-shrink:0 }
        .dc-price small{ display:block; font-size:.5em; font-weight:700; letter-spacing:.06em; opacity:.65 }
        .dc-desc{ font-size:.8rem; line-height:1.6; color:rgba(255,255,255,.62); margin-top:9px }

        .dc-order-btn{
          display:flex; align-items:center; justify-content:center; gap:8px;
          margin-top:18px; padding:14px 0; width:100%;
          border-radius:99px; border:none; cursor:pointer; text-decoration:none;
          background:linear-gradient(135deg,#f0d4a0,#d4a860);
          color:#2a1008; font-weight:800; font-size:.92rem; letter-spacing:.03em;
          box-shadow:0 6px 20px rgba(200,140,40,.35);
        }

        @media (prefers-reduced-motion: reduce){
          .dc-layer{ animation:none !important }
        }
      `}</style>

      <div className="dc-header">
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.jpg" alt="BCB" />
          <span>Basic Chinese Bun</span>
        </a>
      </div>

      <div className="dc-stage">
        <div className="dc-stage-inner">
          <img className="dc-layer" style={{ zIndex: 0 }} src="/dark-choc/01_background.jpg" alt="" />
          <img className="dc-layer dc-ghost" style={{ zIndex: 10 }} src="/dark-choc/02_ghost_text.png" alt="" />
          <img className="dc-layer dc-pattern-layer" style={{ zIndex: 20 }} src="/dark-choc/03_pattern.png" alt="" />
          <img className="dc-layer dc-glow" style={{ zIndex: 30 }} src="/dark-choc/04_glow.png" alt="" />
          <img className="dc-layer dc-shadow" style={{ zIndex: 40 }} src="/dark-choc/05_shadow.png" alt="" />
          <img className="dc-layer dc-choc-back" style={{ zIndex: 50 }} src="/dark-choc/06_chocolate_back.png" alt="" />
          <img className="dc-layer dc-powder" style={{ zIndex: 55 }} src="/dark-choc/07_cocoa_powder.png" alt="" />
          <img className="dc-layer dc-bun" style={{ zIndex: 60 }} src="/dark-choc/08_bun_main.png" alt="Dark Chocolate Bun" />
          <img className="dc-layer dc-choc-front" style={{ zIndex: 70 }} src="/dark-choc/09_chocolate_front.png" alt="" />
          <img className="dc-layer dc-particles" style={{ zIndex: 80 }} src="/dark-choc/10_particles.png" alt="" />
          <img className="dc-layer dc-steam" style={{ zIndex: 90 }} src="/dark-choc/11_steam.png" alt="" />
        </div>
      </div>

      <div className="dc-label">
        <div className="dc-premium-badge">★ Premium</div>
        <div className="dc-name-row">
          <div className="dc-name">ໝັນໂຖ<br />Dark Chocolate</div>
          <div className="dc-price">28,000<small>ກີບ / ກ້ອນ</small></div>
        </div>
        <div className="dc-desc">
          ສຳຜັດຄວາມເຂັ້ມຂຸ້ນຂອງຊັອກໂກແລດແທ້ 100%<br />
          ລະມຸນລີ້ນທຸກຄຳ ຫອມມັນລົງໂຕດ້ວຍສູດພິເສດ
        </div>
        <a href="/order" className="dc-order-btn">🛒 ORDER NOW</a>
      </div>
    </div>
  )
}
