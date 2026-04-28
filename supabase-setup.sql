-- ═══════════════════════════════════════════════════
-- BCB POS - Supabase SQL Setup
-- รัน SQL นี้ใน Supabase SQL Editor ทีละบล็อก
-- ═══════════════════════════════════════════════════

-- 1. ตาราง shop_config (key-value store)
CREATE TABLE IF NOT EXISTS shop_config (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตาราง orders
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  qnum INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'walkin',  -- 'walkin' | 'online'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'rejected'
  items JSONB,
  total INTEGER DEFAULT 0,
  bag_type INTEGER,
  bag_label TEXT,
  customer JSONB,     -- { name, phone, date, time, note }
  slip_url TEXT,
  done BOOLEAN DEFAULT FALSE,
  done_at TIMESTAMPTZ,
  cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Function: next_queue_number (atomic — ไม่ซ้ำกัน)
CREATE OR REPLACE FUNCTION next_queue_number()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_val INTEGER;
  new_val INTEGER;
BEGIN
  SELECT value::INTEGER INTO current_val
  FROM shop_config WHERE key = 'next_queue'
  FOR UPDATE;  -- lock row

  IF NOT FOUND THEN
    current_val := 0;
    INSERT INTO shop_config (key, value) VALUES ('next_queue', '1');
  END IF;

  new_val := COALESCE(current_val, 0) + 1;

  UPDATE shop_config SET value = new_val::TEXT
  WHERE key = 'next_queue';

  RETURN new_val;
END;
$$;

-- 4. Enable Realtime สำหรับทั้ง 2 tables
-- ไปที่ Database > Replication > เปิด orders และ shop_config

-- 5. Storage bucket: bcb-uploads
-- ไปที่ Storage > New bucket > ชื่อ "bcb-uploads" > Public

-- 6. Row Level Security (RLS) — อนุญาต read/write ทุกคน (ปรับทีหลัง)
ALTER TABLE shop_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_shop_config" ON shop_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- 7. Indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_done ON orders(done);

-- ═══════════════════════════════════════════════════
-- หลัง setup เสร็จ ทดสอบด้วย:
-- SELECT * FROM shop_config;
-- SELECT next_queue_number();
-- SELECT * FROM orders;
-- ═══════════════════════════════════════════════════
