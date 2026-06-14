-- ============================================================
-- THE POS FOR YOU — Row Level Security Policies
-- Supabase (PostgreSQL) · Migration 002
-- ============================================================
-- Access model:
--   super_admin  → all tables, all shops
--   shop_owner   → own shop full access
--   manager      → own shop, most write access
--   cashier      → own shop orders + finished inventory
--   viewer       → own shop read-only
--   anonymous    → public pages + pre-order submission only
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS  (SECURITY DEFINER so they bypass RLS)
-- ============================================================

-- Is the calling user a super admin?
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- All shop IDs the calling user belongs to (active memberships only)
CREATE OR REPLACE FUNCTION my_shop_ids()
RETURNS TABLE (shop_id UUID)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT su.shop_id
  FROM shop_users su
  WHERE su.user_id = auth.uid()
    AND su.is_active = TRUE;
$$;

-- Role of the calling user in a specific shop (NULL if not a member)
CREATE OR REPLACE FUNCTION my_role_in_shop(p_shop_id UUID)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role
  FROM shop_users
  WHERE user_id  = auth.uid()
    AND shop_id  = p_shop_id
    AND is_active = TRUE
  LIMIT 1;
$$;

-- ============================================================
-- PLANS  (public read; super_admin write)
-- ============================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_public_read" ON plans
  FOR SELECT USING (is_active = TRUE OR is_super_admin());

CREATE POLICY "plans_super_admin_write" ON plans
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================
-- SHOPS
-- ============================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Public can see active shops (needed for /[slug] pre-order page)
CREATE POLICY "shops_public_read" ON shops
  FOR SELECT USING (is_active = TRUE OR is_super_admin());

-- Super admin full access
CREATE POLICY "shops_super_admin_all" ON shops
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- shop_owner / manager can update their own shop settings
CREATE POLICY "shops_owner_update" ON shops
  FOR UPDATE
  USING (my_role_in_shop(id) IN ('shop_owner','manager'));

-- New shops are created via onboarding edge function (runs as service_role);
-- no INSERT policy needed for regular users.

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_shop_read" ON subscriptions
  FOR SELECT
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

-- Billing is managed by super admin (or billing edge function)
CREATE POLICY "subscriptions_super_write" ON subscriptions
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================
-- BRANCHES
-- ============================================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Public sees active branches (pre-order page needs branch name)
CREATE POLICY "branches_public_read" ON branches
  FOR SELECT
  USING (is_active = TRUE
    OR is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

CREATE POLICY "branches_owner_write" ON branches
  FOR ALL
  USING (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'))
  WITH CHECK (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'));

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users read/write their own profile; super admin sees all
CREATE POLICY "profiles_own" ON profiles
  FOR ALL
  USING (id = auth.uid() OR is_super_admin())
  WITH CHECK (id = auth.uid() OR is_super_admin());

-- ============================================================
-- SHOP USERS
-- ============================================================
ALTER TABLE shop_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_users_read" ON shop_users
  FOR SELECT
  USING (is_super_admin()
    OR user_id = auth.uid()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

CREATE POLICY "shop_users_owner_write" ON shop_users
  FOR ALL
  USING (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'))
  WITH CHECK (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'));

-- ============================================================
-- CATEGORIES
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Active categories are public (pre-order menu browsing)
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT
  USING (is_active = TRUE
    OR is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

CREATE POLICY "categories_owner_write" ON categories
  FOR ALL
  USING (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'))
  WITH CHECK (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'));

-- ============================================================
-- MENU ITEMS
-- ============================================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT
  USING (is_active = TRUE
    OR is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

CREATE POLICY "menu_items_owner_write" ON menu_items
  FOR ALL
  USING (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'))
  WITH CHECK (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'));

-- ============================================================
-- MENU ITEM VARIANTS
-- ============================================================
ALTER TABLE menu_item_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variants_public_read" ON menu_item_variants
  FOR SELECT
  USING (is_active = TRUE
    OR is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

CREATE POLICY "variants_owner_write" ON menu_item_variants
  FOR ALL
  USING (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'))
  WITH CHECK (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'));

-- ============================================================
-- INVENTORY — FINISHED GOODS
-- ============================================================
ALTER TABLE inventory_finished ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_finished_shop_read" ON inventory_finished
  FOR SELECT
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

-- Cashiers can update stock (via POS sale or manual adjustment)
CREATE POLICY "inv_finished_staff_write" ON inventory_finished
  FOR ALL
  USING (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager','cashier'))
  WITH CHECK (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager','cashier'));

-- ============================================================
-- INVENTORY — RAW MATERIALS
-- ============================================================
ALTER TABLE inventory_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_raw_shop_only" ON inventory_raw
  FOR ALL
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()))
  WITH CHECK (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

-- ============================================================
-- RECIPES + RECIPE INGREDIENTS
-- ============================================================
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes_shop_only" ON recipes
  FOR ALL
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()))
  WITH CHECK (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_ingredients_shop_only" ON recipe_ingredients
  FOR ALL
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()))
  WITH CHECK (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

-- ============================================================
-- INVENTORY TRANSACTIONS  (append-only; no DELETE)
-- ============================================================
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_tx_shop_read" ON inventory_transactions
  FOR SELECT
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

CREATE POLICY "inv_tx_shop_insert" ON inventory_transactions
  FOR INSERT
  WITH CHECK (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

-- Transactions are never updated or deleted (audit trail integrity)

-- ============================================================
-- PRE-ORDER ROUNDS
-- ============================================================
ALTER TABLE preorder_rounds ENABLE ROW LEVEL SECURITY;

-- Anyone can see open rounds (for the public pre-order page)
CREATE POLICY "preorder_rounds_public_read" ON preorder_rounds
  FOR SELECT
  USING (status = 'open'
    OR is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

CREATE POLICY "preorder_rounds_owner_write" ON preorder_rounds
  FOR ALL
  USING (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'))
  WITH CHECK (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'));

-- ============================================================
-- PRE-ORDER ROUND ITEMS
-- ============================================================
ALTER TABLE preorder_round_items ENABLE ROW LEVEL SECURITY;

-- Public reads active items in open rounds
CREATE POLICY "preorder_round_items_public_read" ON preorder_round_items
  FOR SELECT
  USING (is_active = TRUE
    OR is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

CREATE POLICY "preorder_round_items_owner_write" ON preorder_round_items
  FOR ALL
  USING (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'))
  WITH CHECK (is_super_admin()
    OR my_role_in_shop(shop_id) IN ('shop_owner','manager'));

-- ============================================================
-- ORDERS
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_shop_read" ON orders
  FOR SELECT
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

-- Staff create walk-in orders; anonymous create preorders
CREATE POLICY "orders_insert" ON orders
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids())
    -- anonymous pre-orders: allowed for any active shop with open round
    OR (
      order_type = 'preorder'
      AND preorder_round_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM preorder_rounds pr
        WHERE pr.id = preorder_round_id
          AND pr.status = 'open'
      )
    )
  );

-- Staff update order status, payment, etc.
CREATE POLICY "orders_shop_update" ON orders
  FOR UPDATE
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

-- ============================================================
-- ORDER ITEMS
-- ============================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_shop_read" ON order_items
  FOR SELECT
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids())
    -- anonymous: allowed if parent order is a valid preorder
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND o.order_type = 'preorder'
    )
  );

CREATE POLICY "order_items_shop_update" ON order_items
  FOR UPDATE
  USING (is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids()));

-- ============================================================
-- AI CONFIGS
-- ============================================================
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_configs_read" ON ai_configs
  FOR SELECT
  USING (
    is_super_admin()
    OR shop_id IN (SELECT shop_id FROM my_shop_ids())
    OR shop_id IS NULL   -- global config readable by any authenticated user
  );

-- Only super admin manages global config; shop_owner manages own
CREATE POLICY "ai_configs_write" ON ai_configs
  FOR ALL
  USING (
    is_super_admin()
    OR (shop_id IS NOT NULL
        AND my_role_in_shop(shop_id) = 'shop_owner')
  )
  WITH CHECK (
    is_super_admin()
    OR (shop_id IS NOT NULL
        AND my_role_in_shop(shop_id) = 'shop_owner')
  );

-- ============================================================
-- STORAGE BUCKETS  (apply in Supabase dashboard or CLI)
-- ============================================================
-- bucket: bcb-uploads (or rename to pos-for-you-uploads)
--   path pattern: {shop_id}/{type}/{filename}
--   types: logos/ | banners/ | menu/ | slips/ | qr/
--
-- Storage RLS (set via Supabase dashboard):
--   SELECT: public read for logos, banners, menu images
--   INSERT: authenticated users belonging to the shop
--   DELETE: shop_owner / manager only
