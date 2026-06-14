-- ============================================================
-- THE POS FOR YOU — Initial Schema
-- Supabase (PostgreSQL) · Migration 001
-- ============================================================
-- Table dependency order:
--   plans → shops → subscriptions
--                 → branches
--                 → profiles (via auth.users)
--                 → shop_users
--                 → categories → menu_items → menu_item_variants
--                 → inventory_finished
--                 → inventory_raw → recipes → recipe_ingredients
--                 → inventory_transactions
--                 → preorder_rounds → preorder_round_items
--                 → orders → order_items
--                 → ai_configs
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- PLANS
-- ============================================================
CREATE TABLE plans (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT        UNIQUE NOT NULL,           -- 'basic' | 'pro' | 'enterprise'
  name           JSONB       NOT NULL DEFAULT '{}',     -- i18n {lo, th, en, zh}
  description    JSONB                 DEFAULT '{}',
  price_monthly  NUMERIC(10,2),                         -- NULL = contact sales
  price_yearly   NUMERIC(10,2),
  price_currency TEXT        NOT NULL DEFAULT 'USD',
  limits         JSONB       NOT NULL DEFAULT '{}',
  -- {max_branches, max_items, max_staff, max_preorder_rounds, storage_gb}
  -- null value = unlimited
  features       JSONB       NOT NULL DEFAULT '{}',
  -- {inventory_raw, recipes, ai_assistant, custom_domain, reports_advanced, canva_editor}
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order     INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SHOPS  (one row = one tenant)
-- ============================================================
CREATE TABLE shops (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- URL: theposforyou.com/[slug]
  slug             TEXT        UNIQUE NOT NULL
                               CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$'),
  name             JSONB       NOT NULL DEFAULT '{}',   -- i18n
  description      JSONB                 DEFAULT '{}',
  logo_url         TEXT,
  banner_urls      JSONB       NOT NULL DEFAULT '[]',   -- carousel
  currency         TEXT        NOT NULL DEFAULT 'LAK',  -- LAK|THB|USD|CNY
  default_language TEXT        NOT NULL DEFAULT 'lo',   -- lo|th|en|zh
  timezone         TEXT        NOT NULL DEFAULT 'Asia/Vientiane',
  contact          JSONB       NOT NULL DEFAULT '{}',
  -- {phone, email, facebook, line, wechat}
  address          JSONB       NOT NULL DEFAULT '{}',
  settings         JSONB       NOT NULL DEFAULT '{}',
  -- {receipt:{header,footer,show_logo},
  --  printer:{type,paper_width},
  --  ordering:{allow_walkin,allow_preorder,tax_rate,service_charge},
  --  display:{customer_display,announcements}}
  plan_id          UUID        REFERENCES plans(id),
  owner_id         UUID,       -- FK to auth.users, set after auth setup
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  trial_ends_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id              UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  plan_id              UUID        NOT NULL REFERENCES plans(id),
  status               TEXT        NOT NULL DEFAULT 'trial'
                                   CHECK (status IN
                                     ('trial','active','past_due','suspended','cancelled')),
  billing_cycle        TEXT                  DEFAULT 'monthly'
                                   CHECK (billing_cycle IN ('monthly','yearly')),
  amount               NUMERIC(10,2),
  currency             TEXT                  DEFAULT 'USD',
  trial_start          TIMESTAMPTZ,
  trial_end            TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  payment_method       JSONB       NOT NULL DEFAULT '{}',
  -- {type:'bcel'|'epay'|'bank_transfer', account_name, account_number}
  payment_reference    TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BRANCHES  (shop → many branches)
-- ============================================================
CREATE TABLE branches (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name           JSONB       NOT NULL DEFAULT '{}',
  address        JSONB                 DEFAULT '{}',
  phone          TEXT,
  printer_config JSONB       NOT NULL DEFAULT '{}',
  -- {enabled, connection:'bluetooth'|'network'|'usb',
  --  address, paper_width:58|80, lao_font_enabled}
  is_main        BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order     INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROFILES  (extends auth.users 1:1)
-- ============================================================
CREATE TABLE profiles (
  id             UUID        PRIMARY KEY,   -- added FK after auth is enabled
  display_name   TEXT,
  avatar_url     TEXT,
  preferred_lang TEXT        NOT NULL DEFAULT 'lo',
  is_super_admin BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SHOP USERS  (auth.users ↔ shops with role)
-- ============================================================
CREATE TABLE shop_users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL,   -- references auth.users
  branch_id   UUID        REFERENCES branches(id) ON DELETE SET NULL,
  -- NULL = access to all branches
  role        TEXT        NOT NULL DEFAULT 'cashier'
                          CHECK (role IN ('shop_owner','manager','cashier','viewer')),
  permissions JSONB       NOT NULL DEFAULT '{}',
  -- granular overrides: {can_void_orders, can_manage_stock, can_view_reports, ...}
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  invited_by  UUID,       -- auth.users
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, user_id)
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        JSONB       NOT NULL DEFAULT '{}',
  description JSONB                 DEFAULT '{}',
  image_url   TEXT,
  sort_order  INT         NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE menu_items (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id           UUID        REFERENCES categories(id) ON DELETE SET NULL,
  name                  JSONB       NOT NULL DEFAULT '{}',
  description           JSONB                 DEFAULT '{}',
  image_urls            JSONB       NOT NULL DEFAULT '[]',
  base_price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_available_walkin   BOOLEAN     NOT NULL DEFAULT TRUE,
  is_available_preorder BOOLEAN     NOT NULL DEFAULT FALSE,
  is_bestseller         BOOLEAN     NOT NULL DEFAULT FALSE,
  tags                  JSONB       NOT NULL DEFAULT '[]',
  -- ['spicy','vegetarian','halal','new','limited']
  sort_order            INT         NOT NULL DEFAULT 0,
  metadata              JSONB       NOT NULL DEFAULT '{}',
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Variants (S/M/L, hot/iced, etc.)
CREATE TABLE menu_item_variants (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  menu_item_id   UUID        NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name           JSONB       NOT NULL DEFAULT '{}',
  price_modifier NUMERIC(10,2) NOT NULL DEFAULT 0,   -- added to base_price
  sku            TEXT,
  sort_order     INT         NOT NULL DEFAULT 0,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE
);

-- ============================================================
-- INVENTORY — FINISHED GOODS
-- ============================================================
CREATE TABLE inventory_finished (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  branch_id           UUID        NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  menu_item_id        UUID        NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  variant_id          UUID        REFERENCES menu_item_variants(id),
  quantity            INT         NOT NULL DEFAULT 0,
  reserved_quantity   INT         NOT NULL DEFAULT 0,
  -- held by pending orders/preorders; actual available = quantity - reserved_quantity
  low_stock_threshold INT         NOT NULL DEFAULT 5,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (branch_id, menu_item_id, variant_id)
);

-- ============================================================
-- INVENTORY — RAW MATERIALS
-- ============================================================
CREATE TABLE inventory_raw (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  branch_id           UUID          REFERENCES branches(id),
  -- NULL = shop-level central warehouse
  name                JSONB         NOT NULL DEFAULT '{}',
  unit                TEXT          NOT NULL,   -- kg|g|L|ml|pcs|pack
  quantity            NUMERIC(14,4) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(14,4) NOT NULL DEFAULT 0,
  cost_per_unit       NUMERIC(12,4) NOT NULL DEFAULT 0,
  supplier_info       JSONB         NOT NULL DEFAULT '{}',
  -- {name, phone, lead_time_days}
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RECIPES  (1 menu_item[+variant] = 1 recipe)
-- ============================================================
CREATE TABLE recipes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  menu_item_id   UUID        NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  variant_id     UUID        REFERENCES menu_item_variants(id),
  yield_quantity INT         NOT NULL DEFAULT 1,
  -- units produced per one batch (e.g., recipe makes 10 pcs)
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (menu_item_id, variant_id)
);

CREATE TABLE recipe_ingredients (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  recipe_id       UUID          NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  raw_material_id UUID          NOT NULL REFERENCES inventory_raw(id) ON DELETE RESTRICT,
  quantity        NUMERIC(14,4) NOT NULL,   -- per yield_quantity
  unit            TEXT          NOT NULL
);

-- ============================================================
-- INVENTORY TRANSACTIONS  (append-only audit log)
-- ============================================================
CREATE TABLE inventory_transactions (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id          UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  branch_id        UUID          REFERENCES branches(id),
  transaction_type TEXT          NOT NULL,
  -- sale | restock | adjustment | production | waste | reserve | release
  item_type        TEXT          NOT NULL CHECK (item_type IN ('finished','raw')),
  item_id          UUID          NOT NULL,   -- menu_item_id or raw_material_id
  variant_id       UUID,
  quantity_change  NUMERIC(14,4) NOT NULL,   -- negative = reduction
  quantity_before  NUMERIC(14,4),
  quantity_after   NUMERIC(14,4),
  reference_type   TEXT,         -- order | preorder | manual | recipe
  reference_id     UUID,
  notes            TEXT,
  created_by       UUID,         -- auth.users
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRE-ORDER ROUNDS
-- ============================================================
CREATE TABLE preorder_rounds (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  branch_id       UUID        REFERENCES branches(id),   -- NULL = all branches
  name            JSONB       NOT NULL DEFAULT '{}',
  opens_at        TIMESTAMPTZ NOT NULL,
  closes_at       TIMESTAMPTZ NOT NULL,
  pickup_start    TIMESTAMPTZ,
  pickup_end      TIMESTAMPTZ,
  payment_options JSONB       NOT NULL DEFAULT '["prepay","on_pickup"]',
  -- which payment modes shop allows for this round
  qr_image_url    TEXT,   -- BCEL/bank transfer QR
  status          TEXT        NOT NULL DEFAULT 'draft'
                              CHECK (status IN
                                ('draft','open','closed','fulfilled','cancelled')),
  notes           JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (closes_at > opens_at)
);

-- Items available per round with individual limits
CREATE TABLE preorder_round_items (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID    NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  round_id       UUID    NOT NULL REFERENCES preorder_rounds(id) ON DELETE CASCADE,
  menu_item_id   UUID    NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  variant_id     UUID    REFERENCES menu_item_variants(id),
  price          NUMERIC(10,2) NOT NULL,   -- price for this round (can differ from base)
  stock_limit    INT,            -- NULL = unlimited
  reserved_count INT     NOT NULL DEFAULT 0,   -- updated by trigger on order insert
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (round_id, menu_item_id, variant_id)
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id           UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  branch_id         UUID        NOT NULL REFERENCES branches(id),
  preorder_round_id UUID        REFERENCES preorder_rounds(id),
  -- NULL for walk-in orders
  order_type        TEXT        NOT NULL DEFAULT 'walkin'
                                CHECK (order_type IN ('walkin','preorder')),
  queue_number      TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN
                                  ('pending','confirmed','preparing','ready',
                                   'done','cancelled','rejected')),
  customer_name     TEXT,
  customer_phone    TEXT,
  table_number      TEXT,
  -- Denormalized snapshot so receipts survive menu edits
  items_snapshot    JSONB       NOT NULL DEFAULT '[]',
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  total             NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency          TEXT,   -- inherits from shop if NULL
  payment_method    TEXT,   -- cash|qr|card|on_pickup
  payment_status    TEXT        NOT NULL DEFAULT 'unpaid'
                                CHECK (payment_status IN ('unpaid','paid','refunded')),
  payment_reference TEXT,
  slip_url          TEXT,   -- uploaded payment proof image
  notes             TEXT,
  served_by         UUID,   -- auth.users (staff who processed)
  -- Offline sync tracking
  device_id         TEXT,   -- identifies the POS terminal/device
  synced_at         TIMESTAMPTZ,  -- NULL = created offline, pending sync
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  done_at           TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id       UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id   UUID          REFERENCES menu_items(id) ON DELETE SET NULL,
  variant_id     UUID          REFERENCES menu_item_variants(id),
  name_snapshot  JSONB         NOT NULL DEFAULT '{}',   -- i18n name at order time
  price_snapshot NUMERIC(10,2) NOT NULL,
  quantity       INT           NOT NULL DEFAULT 1,
  subtotal       NUMERIC(10,2) NOT NULL,
  notes          TEXT
);

-- ============================================================
-- AI INTEGRATION LAYER  (future-proof, swap-ready)
-- ============================================================
CREATE TABLE ai_configs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID        REFERENCES shops(id) ON DELETE CASCADE,
  -- NULL = global default used by all shops
  provider     TEXT        NOT NULL DEFAULT 'claude',
  -- 'claude' | 'local' | 'openai_compatible'
  endpoint_url TEXT,       -- for local/custom OpenAI-compatible endpoint
  model_name   TEXT                  DEFAULT 'claude-sonnet-4-6',
  api_key_ref  TEXT,
  -- reference to Supabase Vault secret, NOT the key itself
  features     JSONB       NOT NULL DEFAULT '{}',
  -- {chatbot, menu_suggestions, sales_insights, demand_forecast}
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
-- Tenancy lookups
CREATE INDEX idx_shop_users_user_id       ON shop_users(user_id);
CREATE INDEX idx_shop_users_shop_id       ON shop_users(shop_id);
CREATE INDEX idx_branches_shop_id         ON branches(shop_id);
CREATE INDEX idx_subscriptions_shop_id    ON subscriptions(shop_id);

-- Menu + catalog
CREATE INDEX idx_categories_shop_id       ON categories(shop_id, sort_order);
CREATE INDEX idx_menu_items_shop_cat      ON menu_items(shop_id, category_id, sort_order);
CREATE INDEX idx_menu_items_preorder      ON menu_items(shop_id, is_available_preorder)
  WHERE is_available_preorder = TRUE;
CREATE INDEX idx_variants_item            ON menu_item_variants(menu_item_id);

-- Inventory
CREATE INDEX idx_inv_finished_branch      ON inventory_finished(branch_id, menu_item_id);
CREATE INDEX idx_inv_raw_shop             ON inventory_raw(shop_id, branch_id);
CREATE INDEX idx_inv_tx_shop_time         ON inventory_transactions(shop_id, created_at DESC);

-- Pre-order
CREATE INDEX idx_preorder_rounds_shop_status
  ON preorder_rounds(shop_id, status, opens_at);
CREATE INDEX idx_preorder_round_items_round
  ON preorder_round_items(round_id, is_active);

-- Orders (hot path)
CREATE INDEX idx_orders_shop_created      ON orders(shop_id, created_at DESC);
CREATE INDEX idx_orders_shop_status       ON orders(shop_id, status);
CREATE INDEX idx_orders_branch_status     ON orders(branch_id, status);
CREATE INDEX idx_orders_preorder_round    ON orders(preorder_round_id)
  WHERE preorder_round_id IS NOT NULL;
CREATE INDEX idx_orders_unsynced          ON orders(shop_id, synced_at)
  WHERE synced_at IS NULL;
CREATE INDEX idx_order_items_order        ON order_items(order_id);

-- ============================================================
-- updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'shops','branches','subscriptions','profiles','shop_users',
    'menu_items','recipes','inventory_raw','preorder_rounds',
    'orders','ai_configs'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION _set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Queue number generator  (per branch, resets daily)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_queue_number(p_branch_id UUID)
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  today      DATE := CURRENT_DATE;
  seq_num    INT;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN created_at::DATE = today
         THEN CAST(NULLIF(regexp_replace(queue_number, '\D', '', 'g'), '') AS INT)
         ELSE 0
    END
  ), 0) + 1
  INTO seq_num
  FROM orders
  WHERE branch_id = p_branch_id
    AND created_at::DATE = today;

  RETURN LPAD(seq_num::TEXT, 3, '0');
END;
$$;

-- ============================================================
-- preorder_round_items.reserved_count auto-update trigger
-- ============================================================
CREATE OR REPLACE FUNCTION _sync_preorder_reserved_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Recalculate reserved_count for affected round_items
  -- Called after INSERT/UPDATE/DELETE on orders
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.preorder_round_id IS NOT NULL THEN
    UPDATE preorder_round_items pri
    SET reserved_count = (
      SELECT COALESCE(SUM((item->>'quantity')::INT), 0)
      FROM orders o,
           jsonb_array_elements(o.items_snapshot) AS item
      WHERE o.preorder_round_id = NEW.preorder_round_id
        AND o.status NOT IN ('cancelled','rejected')
        AND (item->>'menu_item_id')::UUID = pri.menu_item_id
    )
    WHERE pri.round_id = NEW.preorder_round_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_sync_reserved
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION _sync_preorder_reserved_count();

-- ============================================================
-- Realtime publications
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE preorder_round_items;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_finished;
ALTER PUBLICATION supabase_realtime ADD TABLE preorder_rounds;
