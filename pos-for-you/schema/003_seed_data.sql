-- ============================================================
-- THE POS FOR YOU — Seed Data
-- Supabase (PostgreSQL) · Migration 003
-- ============================================================
-- Run after 001 + 002. Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================================

-- Plans
INSERT INTO plans
  (code, name, description, price_monthly, price_yearly, price_currency,
   limits, features, sort_order)
VALUES
(
  'basic',
  '{"lo":"ພື້ນຖານ","th":"พื้นฐาน","en":"Basic","zh":"基础版"}',
  '{"lo":"ເໝາະສຳລັບຮ້ານຂະໜາດນ້ອຍ ຫຼື ຮ້ານດ່ຽວ","en":"Perfect for single-location shops","th":"เหมาะสำหรับร้านขนาดเล็ก","zh":"适合小型单店"}',
  9.99, 99.99, 'USD',
  '{"max_branches":1,"max_items":50,"max_staff":3,"max_preorder_rounds":2,"storage_gb":1}',
  '{"inventory_raw":false,"recipes":false,"ai_assistant":false,"custom_domain":false,"reports_advanced":false,"canva_editor":false,"multi_branch":false}',
  1
),
(
  'pro',
  '{"lo":"ໂປ","th":"โปร","en":"Pro","zh":"专业版"}',
  '{"lo":"ສຳລັບຮ້ານທີ່ກຳລັງຂະຫຍາຍ ມີສາຂາຫຼາຍກ່ວາ 1","en":"For growing businesses with multiple branches","th":"สำหรับธุรกิจที่กำลังเติบโต","zh":"适合多店扩张中的餐厅"}',
  24.99, 249.99, 'USD',
  '{"max_branches":3,"max_items":200,"max_staff":10,"max_preorder_rounds":10,"storage_gb":10}',
  '{"inventory_raw":true,"recipes":true,"ai_assistant":false,"custom_domain":false,"reports_advanced":true,"canva_editor":false,"multi_branch":true}',
  2
),
(
  'enterprise',
  '{"lo":"ອົງກອນ","th":"องค์กร","en":"Enterprise","zh":"企业版"}',
  '{"lo":"ສຳລັບສາຍໂສ້ຮ້ານ ບໍ່ຈຳກັດ","en":"Unlimited — for restaurant chains","th":"ไม่จำกัด สำหรับเชนร้านอาหาร","zh":"无限制，适合连锁餐厅"}',
  NULL, NULL, 'USD',
  '{"max_branches":null,"max_items":null,"max_staff":null,"max_preorder_rounds":null,"storage_gb":100}',
  '{"inventory_raw":true,"recipes":true,"ai_assistant":true,"custom_domain":true,"reports_advanced":true,"canva_editor":true,"multi_branch":true}',
  3
)
ON CONFLICT (code) DO NOTHING;

-- Global AI config (default — uses Claude API, shop_id = NULL)
INSERT INTO ai_configs
  (provider, endpoint_url, model_name, features, is_active)
VALUES
  (
    'claude',
    NULL,
    'claude-sonnet-4-6',
    '{"chatbot":false,"menu_suggestions":false,"sales_insights":false,"demand_forecast":false}',
    FALSE   -- off until API key is configured via Vault
  )
ON CONFLICT DO NOTHING;
