# 🥟 Basic Chinese Bun — Next.js POS

## Quick Start

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า Supabase
- สมัครที่ supabase.com (ฟรี)
- สร้าง project ใหม่
- ไปที่ SQL Editor → รัน `supabase-setup.sql`
- ไปที่ Storage → สร้าง bucket ชื่อ **bcb-uploads** (Public)
- ไปที่ Database → Replication → เปิด orders + shop_config

### 3. ใส่ Environment Variables
แก้ไฟล์ `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. รัน development server
```bash
npm run dev
```
เปิด http://localhost:3000

### 5. URLs
- 🛒 Walk-in: http://localhost:3000/order
- 🌐 Pre-order: http://localhost:3000/preorder
- 👨‍💼 Staff: http://localhost:3000/staff

---

## Deploy to Vercel (ฟรี)
```bash
npm install -g vercel
vercel
```
หรือ connect GitHub repo ที่ vercel.com

---

## โครงสร้างไฟล์
```
src/
  app/
    order/page.js      — ลูกค้า Walk-in
    preorder/page.js   — ลูกค้าสั่งออนไลน์
    staff/page.js      — พนักงาน
    layout.js          — Root layout
    globals.css        — Styles
  lib/
    supabase.js        — Supabase client
```
