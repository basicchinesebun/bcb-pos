'use client';
import { useEffect, useRef, useState } from 'react';

const SERVICES = [
  {
    id: 'bc1', color: '#6B3A2A', name: 'BRANDING\nPACKAGE™',
    specs: [['Logo Design','✓'], ['Brand Guide','✓'], ['Color System','✓'], ['Typography','✓'], ['Revisions','3×'], ['Delivery','14 DAYS']],
    price: '฿35,000', unit: '/ package', barcode: '4 901234 567890',
  },
  {
    id: 'bc2', color: '#2A4A6B', name: 'WEB DESIGN\nDELUXE™',
    specs: [['UI/UX Design','✓'], ['Development','✓'], ['CMS Setup','✓'], ['Responsive','✓'], ['Pages','UP TO 10'], ['Delivery','30 DAYS']],
    price: '฿85,000', unit: '/ package', barcode: '4 901234 567891',
  },
  {
    id: 'bc3', color: '#3A6B2A', name: 'SOCIAL MEDIA\nBUNDLE™',
    specs: [['Posts / Month','30×'], ['Stories','✓'], ['Copywriting','✓'], ['Scheduling','✓'], ['Analytics','MONTHLY'], ['Contract','3 MONTHS']],
    price: '฿18,000', unit: '/ month', barcode: '4 901234 567892',
  },
  {
    id: 'bc4', color: '#6B2A4A', name: 'VIDEO\nPRODUCTION™',
    specs: [['Concept','✓'], ['Shooting Days','2×'], ['Editing','✓'], ['Color Grade','✓'], ['Duration','UP TO 3 MIN'], ['Delivery','21 DAYS']],
    price: '฿55,000', unit: '/ video', barcode: '4 901234 567893',
  },
];

function Barcode({ seed = 0, count = 24, height = 40 }) {
  const bars = Array.from({ length: count }, (_, i) => {
    const h = 10 + ((seed * 7 + i * 13) % 26);
    return <div key={i} style={{ background: '#6B3A2A', width: 2, height: h, display: 'inline-block', marginRight: 2 }} />;
  });
  return <div style={{ display: 'flex', alignItems: 'flex-end', height, gap: 0 }}>{bars}</div>;
}

function ThreeCanvas() {
  const canvasRef = useRef(null);
  const stateRef = useRef({ isDragging: false, prevX: 0, group: null, boxes: [], time: 0 });

  useEffect(() => {
    let THREE, renderer, scene, camera, animId;

    async function init() {
      THREE = (await import('three')).default || await import('three');

      const canvas = canvasRef.current;
      const container = canvas.parentElement;

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.shadowMap.enabled = true;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(0, 1.5, 7);

      scene.add(new THREE.AmbientLight(0xf5edd6, 0.8));
      const dir = new THREE.DirectionalLight(0xfff5e0, 1.5);
      dir.position.set(5, 8, 5);
      dir.castShadow = true;
      scene.add(dir);
      const back = new THREE.DirectionalLight(0x6b3a2a, 0.4);
      back.position.set(-5, -2, -3);
      scene.add(back);

      const group = new THREE.Group();
      stateRef.current.group = group;

      const colors = [0x6B3A2A, 0x2A4A6B, 0x3A6B2A, 0x6B2A4A];
      colors.forEach((color, i) => {
        const geo = new THREE.BoxGeometry(1.2, 1.6, 0.8);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 });
        const labelMat = new THREE.MeshStandardMaterial({ color: 0xf5edd6, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, [mat, mat, mat, mat, labelMat, mat]);
        const angle = (i / colors.length) * Math.PI * 2;
        mesh.position.set(Math.sin(angle) * 2.2, 0, Math.cos(angle) * 2.2);
        mesh.rotation.y = -angle;
        mesh.castShadow = true;
        group.add(mesh);
        stateRef.current.boxes.push(mesh);
      });
      scene.add(group);

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({ color: 0xf5edd6, roughness: 1 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.85;
      floor.receiveShadow = true;
      scene.add(floor);

      function animate() {
        animId = requestAnimationFrame(animate);
        stateRef.current.time += 0.01;
        if (!stateRef.current.isDragging) group.rotation.y += 0.004;
        stateRef.current.boxes.forEach((b, i) => {
          b.rotation.y += 0.003;
          b.position.y = Math.sin(stateRef.current.time + i * 1.2) * 0.12;
        });
        renderer.render(scene, camera);
      }
      animate();

      const onResize = () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);
    }

    init();

    return () => {
      cancelAnimationFrame(animId);
      renderer?.dispose();
    };
  }, []);

  const onMouseDown = e => { stateRef.current.isDragging = true; stateRef.current.prevX = e.clientX; };
  const onMouseMove = e => {
    if (!stateRef.current.isDragging || !stateRef.current.group) return;
    stateRef.current.group.rotation.y += (e.clientX - stateRef.current.prevX) * 0.008;
    stateRef.current.prevX = e.clientX;
  };
  const onMouseUp = () => { stateRef.current.isDragging = false; };

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', cursor: 'grab', display: 'block' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    />
  );
}

export default function DemoPage() {
  const [cart, setCart] = useState([]);

  const addToCart = (svc) => {
    setCart(prev => {
      const existing = prev.find(i => i.name === svc.name);
      if (existing) return prev.map(i => i.name === svc.name ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { name: svc.name, price: parseInt(svc.price.replace(/[฿,]/g, '')), qty: 1 }];
    });
    document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div style={{ background: '#F5EDD6', fontFamily: "'Space Mono', monospace", color: '#1a1008', overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Playfair+Display:wght@700&display=swap');
        .product-card { transition: transform 0.2s; }
        .product-card:hover { transform: translateY(-4px); }
        .add-btn:hover { background: #9C6344 !important; }
      `}</style>

      {/* Top stripe */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 6, background: 'repeating-linear-gradient(90deg, #6B3A2A 0px, #6B3A2A 12px, transparent 12px, transparent 20px)', zIndex: 100 }} />

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px 60px', position: 'relative' }}>
        <div style={{ border: '2px solid #6B3A2A', padding: '24px 48px', marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 6, color: '#9C6344', marginBottom: 8 }}>✦ ✦ ✦</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px,8vw,80px)', color: '#6B3A2A', letterSpacing: -2, lineHeight: 1 }}>AGENCY™</div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#9C6344', marginTop: 8 }}>PREMIUM CREATIVE SERVICES — EST. 2024</div>
          <div style={{ fontSize: 11, letterSpacing: 6, color: '#9C6344', marginTop: 8 }}>✦ ✦ ✦</div>
        </div>

        <div style={{ fontSize: 11, color: '#9C6344', lineHeight: 2.2, marginBottom: 40 }}>
          DATE: 2024-12-01 &nbsp;|&nbsp; REG #: 001 &nbsp;|&nbsp; CASHIER: CLAUDE<br />
          STORE: CREATIVE SUPERMARKET™ &nbsp;|&nbsp; TAX ID: AG-00247
        </div>

        <div style={{ width: '100%', maxWidth: 700, height: 420, borderRadius: 4, overflow: 'hidden' }}>
          <ThreeCanvas />
        </div>
        <p style={{ fontSize: 10, letterSpacing: 3, color: '#9C6344', marginTop: 8, textTransform: 'uppercase' }}>
          ← drag to rotate · scroll to zoom →
        </p>

        <div style={{ position: 'absolute', bottom: 32, fontSize: 10, letterSpacing: 3, color: '#9C6344', animation: 'bounce 2s infinite' }}>
          ▼ &nbsp;scroll to shop&nbsp; ▼
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: '2px dashed #c8b99a', margin: '0 auto 60px', maxWidth: 860 }} />

      {/* ── PRODUCTS ── */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>
        <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#9C6344', marginBottom: 32 }}>
          <span style={{ background: '#6B3A2A', color: '#F5EDD6', padding: '3px 8px', marginRight: 8 }}>AISLE 01</span>
          Our Services
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {SERVICES.map((svc, si) => (
            <div key={svc.id} className="product-card" style={{ border: '2px solid #6B3A2A', padding: 20, background: '#fff9ee' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#6B3A2A', borderBottom: '6px solid #6B3A2A', paddingBottom: 4, marginBottom: 12, whiteSpace: 'pre-line', letterSpacing: -0.5 }}>
                {svc.name}
              </div>
              {svc.specs.map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #e8ddc8', fontSize: 12 }}>
                  <span style={{ color: '#9C6344' }}>{label}</span>
                  <span style={{ fontWeight: 700 }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, fontSize: 28, fontWeight: 700, color: '#6B3A2A', letterSpacing: -1 }}>
                {svc.price} <span style={{ fontSize: 14, fontWeight: 400, color: '#9C6344' }}>{svc.unit}</span>
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Barcode seed={si * 31} count={24} height={40} />
                <div style={{ fontSize: 9, letterSpacing: 3, color: '#9C6344', marginTop: 4 }}>{svc.barcode}</div>
              </div>
              <button
                className="add-btn"
                onClick={() => addToCart(svc)}
                style={{ display: 'block', width: '100%', marginTop: 14, padding: 10, background: '#6B3A2A', color: '#F5EDD6', border: 'none', fontFamily: 'Space Mono, monospace', fontSize: 12, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', transition: 'background 0.2s' }}
              >
                + Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: '2px dashed #c8b99a', margin: '0 auto 60px', maxWidth: 860 }} />

      {/* ── CART / RECEIPT ── */}
      <section id="cart-section" style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px 120px' }}>
        <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#9C6344', marginBottom: 32, textAlign: 'center' }}>
          <span style={{ background: '#6B3A2A', color: '#F5EDD6', padding: '3px 8px', marginRight: 8 }}>CHECKOUT</span>
          Your Receipt
        </p>
        <div style={{ border: '2px solid #6B3A2A', padding: 32, background: '#fff9ee' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #c8b99a', paddingBottom: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#6B3A2A' }}>AGENCY™</div>
            <p style={{ fontSize: 10, color: '#9C6344', marginTop: 4, letterSpacing: 2 }}>CREATIVE SUPERMARKET · THANK YOU FOR SHOPPING</p>
          </div>

          {cart.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9C6344', textAlign: 'center', padding: '20px 0' }}>— Cart is empty. Add services above. —</div>
          ) : (
            cart.map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px dashed #c8b99a' }}>
                <span>{item.name.replace('\n', ' ')} ×{item.qty}</span>
                <span style={{ color: '#6B3A2A', fontWeight: 700 }}>฿{(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: '#6B3A2A', marginTop: 20, paddingTop: 12, borderTop: '3px solid #6B3A2A' }}>
            <span>TOTAL</span>
            <span>฿{total.toLocaleString()}</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 48, gap: 1, marginBottom: 6 }}>
              {Array.from({ length: 48 }, (_, i) => (
                <div key={i} style={{ background: '#6B3A2A', width: i % 3 === 0 ? 1 : 2, height: 24 + (i * 7 % 20) }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#9C6344', lineHeight: 2, letterSpacing: 1 }}>
              **** ITEMS SAVED · THANK YOU ****<br />
              www.agency-supermarket.com
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
    </div>
  );
}
