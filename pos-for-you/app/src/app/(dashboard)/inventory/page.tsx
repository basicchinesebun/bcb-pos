'use client'

import { useState, useMemo } from 'react'
import {
  Package, Plus, Minus, Edit2, History, AlertTriangle,
  CheckCircle, Search, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import { I18nText } from '@/types/app'

// ── Types ──────────────────────────────────────────────────────────────────────
type Unit = 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'pack' | 'box' | 'bottle'
type TabId = 'finished' | 'raw'
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
type TransactionReason = 'restock' | 'waste' | 'sale' | 'correction' | 'production'

interface Transaction {
  id: string
  date: string
  quantity_change: number
  reason: TransactionReason
  note?: string
  performed_by: string
}

interface InventoryItem {
  id: string
  name: I18nText
  unit: Unit
  current_stock: number
  min_threshold: number
  cost_per_unit: number
  last_updated: string
  transactions: Transaction[]
}

// ── Mock Data ──────────────────────────────────────────────────────────────────
const FINISHED_GOODS: InventoryItem[] = [
  {
    id: 'fg1',
    name: { en: 'Steamed Bun (Plain)', lo: 'ຊາລາເປົ່າ (ທຳມະດາ)', th: 'ซาลาเปา (ธรรมดา)', zh: '白馒头' },
    unit: 'pcs', current_stock: 120, min_threshold: 30, cost_per_unit: 0.80,
    last_updated: '2026-06-14T08:00:00Z',
    transactions: [
      { id: 't1', date: '2026-06-14T08:00:00Z', quantity_change: +50, reason: 'restock', note: 'Morning batch', performed_by: 'Staff A' },
      { id: 't2', date: '2026-06-14T06:30:00Z', quantity_change: -20, reason: 'sale', performed_by: 'POS' },
      { id: 't3', date: '2026-06-13T17:00:00Z', quantity_change: -5, reason: 'waste', note: 'Expired end of day', performed_by: 'Staff B' },
      { id: 't4', date: '2026-06-13T12:00:00Z', quantity_change: +100, reason: 'restock', performed_by: 'Staff A' },
      { id: 't5', date: '2026-06-13T09:00:00Z', quantity_change: -30, reason: 'sale', performed_by: 'POS' },
    ],
  },
  {
    id: 'fg2',
    name: { en: 'Steamed Bun (Chicken)', lo: 'ຊາລາເປົ່າ (ໄກ່)', th: 'ซาลาเปา (ไก่)', zh: '鸡肉包' },
    unit: 'pcs', current_stock: 18, min_threshold: 25, cost_per_unit: 1.20,
    last_updated: '2026-06-14T07:45:00Z',
    transactions: [
      { id: 't6', date: '2026-06-14T07:45:00Z', quantity_change: -12, reason: 'sale', performed_by: 'POS' },
      { id: 't7', date: '2026-06-14T06:00:00Z', quantity_change: +30, reason: 'restock', note: 'Morning production', performed_by: 'Staff A' },
      { id: 't8', date: '2026-06-13T18:00:00Z', quantity_change: -8, reason: 'waste', performed_by: 'Staff B' },
      { id: 't9', date: '2026-06-13T12:00:00Z', quantity_change: -15, reason: 'sale', performed_by: 'POS' },
      { id: 't10', date: '2026-06-13T08:00:00Z', quantity_change: +40, reason: 'restock', performed_by: 'Staff A' },
    ],
  },
  {
    id: 'fg3',
    name: { en: 'Steamed Bun (BBQ Pork)', lo: 'ຊາລາເປົ່າ (ໝູBBQ)', th: 'ซาลาเปา (หมูบาร์บีคิว)', zh: '叉烧包' },
    unit: 'pcs', current_stock: 0, min_threshold: 20, cost_per_unit: 1.50,
    last_updated: '2026-06-14T09:00:00Z',
    transactions: [
      { id: 't11', date: '2026-06-14T09:00:00Z', quantity_change: -22, reason: 'sale', performed_by: 'POS' },
      { id: 't12', date: '2026-06-14T06:00:00Z', quantity_change: +22, reason: 'restock', performed_by: 'Staff A' },
      { id: 't13', date: '2026-06-13T17:00:00Z', quantity_change: -18, reason: 'sale', performed_by: 'POS' },
      { id: 't14', date: '2026-06-13T08:00:00Z', quantity_change: +30, reason: 'restock', performed_by: 'Staff A' },
      { id: 't15', date: '2026-06-12T17:00:00Z', quantity_change: -10, reason: 'waste', performed_by: 'Staff B' },
    ],
  },
  {
    id: 'fg4',
    name: { en: 'Fried Rice (Chicken)', lo: 'ເຂົ້າຜັດໄກ່', th: 'ข้าวผัดไก่', zh: '鸡炒饭' },
    unit: 'pcs', current_stock: 45, min_threshold: 15, cost_per_unit: 2.50,
    last_updated: '2026-06-14T08:30:00Z',
    transactions: [
      { id: 't16', date: '2026-06-14T08:30:00Z', quantity_change: -5, reason: 'sale', performed_by: 'POS' },
      { id: 't17', date: '2026-06-14T07:00:00Z', quantity_change: +50, reason: 'restock', note: 'Prepared fresh', performed_by: 'Kitchen' },
      { id: 't18', date: '2026-06-13T19:00:00Z', quantity_change: -3, reason: 'waste', performed_by: 'Staff B' },
      { id: 't19', date: '2026-06-13T12:00:00Z', quantity_change: -20, reason: 'sale', performed_by: 'POS' },
      { id: 't20', date: '2026-06-13T07:00:00Z', quantity_change: +40, reason: 'restock', performed_by: 'Kitchen' },
    ],
  },
  {
    id: 'fg5',
    name: { en: 'Bubble Tea (Original)', lo: 'ຊານົມໄຂ່ມຸກ (ດັ້ງເດີມ)', th: 'ชานมไข่มุก (ต้นตำรับ)', zh: '原味珍珠奶茶' },
    unit: 'pcs', current_stock: 8, min_threshold: 10, cost_per_unit: 1.80,
    last_updated: '2026-06-14T09:15:00Z',
    transactions: [
      { id: 't21', date: '2026-06-14T09:15:00Z', quantity_change: -7, reason: 'sale', performed_by: 'POS' },
      { id: 't22', date: '2026-06-14T07:30:00Z', quantity_change: +15, reason: 'restock', performed_by: 'Staff C' },
      { id: 't23', date: '2026-06-13T18:00:00Z', quantity_change: -12, reason: 'sale', performed_by: 'POS' },
      { id: 't24', date: '2026-06-13T08:00:00Z', quantity_change: +20, reason: 'restock', performed_by: 'Staff C' },
      { id: 't25', date: '2026-06-12T17:00:00Z', quantity_change: -1, reason: 'waste', note: 'Spilled', performed_by: 'Staff C' },
    ],
  },
  {
    id: 'fg6',
    name: { en: 'Iced Latte', lo: 'ລາເຕເຢັນ', th: 'ลาเต้เย็น', zh: '冰拿铁' },
    unit: 'pcs', current_stock: 60, min_threshold: 20, cost_per_unit: 1.20,
    last_updated: '2026-06-14T08:00:00Z',
    transactions: [
      { id: 't26', date: '2026-06-14T08:00:00Z', quantity_change: -10, reason: 'sale', performed_by: 'POS' },
      { id: 't27', date: '2026-06-14T07:00:00Z', quantity_change: +60, reason: 'restock', performed_by: 'Staff C' },
      { id: 't28', date: '2026-06-13T17:00:00Z', quantity_change: -25, reason: 'sale', performed_by: 'POS' },
      { id: 't29', date: '2026-06-13T07:00:00Z', quantity_change: +50, reason: 'restock', performed_by: 'Staff C' },
      { id: 't30', date: '2026-06-12T17:00:00Z', quantity_change: -2, reason: 'waste', performed_by: 'Staff C' },
    ],
  },
  {
    id: 'fg7',
    name: { en: 'Chocolate Cake (Slice)', lo: 'ເຄັກຊັອກໂກແລັດ (ຊິ້ນ)', th: 'เค้กช็อกโกแลต (ชิ้น)', zh: '巧克力蛋糕片' },
    unit: 'pcs', current_stock: 24, min_threshold: 8, cost_per_unit: 3.00,
    last_updated: '2026-06-14T07:00:00Z',
    transactions: [
      { id: 't31', date: '2026-06-14T07:00:00Z', quantity_change: +24, reason: 'restock', note: 'New cake baked', performed_by: 'Kitchen' },
      { id: 't32', date: '2026-06-13T19:00:00Z', quantity_change: -8, reason: 'sale', performed_by: 'POS' },
      { id: 't33', date: '2026-06-13T14:00:00Z', quantity_change: -4, reason: 'sale', performed_by: 'POS' },
      { id: 't34', date: '2026-06-13T07:00:00Z', quantity_change: +24, reason: 'restock', performed_by: 'Kitchen' },
      { id: 't35', date: '2026-06-12T19:00:00Z', quantity_change: -2, reason: 'waste', note: 'Quality issue', performed_by: 'Staff B' },
    ],
  },
  {
    id: 'fg8',
    name: { en: 'Mango Sticky Rice (Box)', lo: 'ເຂົ້າໜຽວມະມ່ວງ (ກ່ອງ)', th: 'ข้าวเหนียวมะม่วง (กล่อง)', zh: '芒果糯米饭套餐' },
    unit: 'box', current_stock: 14, min_threshold: 10, cost_per_unit: 2.00,
    last_updated: '2026-06-14T08:45:00Z',
    transactions: [
      { id: 't36', date: '2026-06-14T08:45:00Z', quantity_change: -6, reason: 'sale', performed_by: 'POS' },
      { id: 't37', date: '2026-06-14T07:00:00Z', quantity_change: +20, reason: 'restock', performed_by: 'Kitchen' },
      { id: 't38', date: '2026-06-13T18:00:00Z', quantity_change: -10, reason: 'sale', performed_by: 'POS' },
      { id: 't39', date: '2026-06-13T07:00:00Z', quantity_change: +20, reason: 'restock', performed_by: 'Kitchen' },
      { id: 't40', date: '2026-06-12T18:00:00Z', quantity_change: -1, reason: 'waste', performed_by: 'Staff B' },
    ],
  },
]

const RAW_MATERIALS: InventoryItem[] = [
  {
    id: 'rm1',
    name: { en: 'All-Purpose Flour', lo: 'ແປ້ງສາລີ', th: 'แป้งสาลี', zh: '面粉' },
    unit: 'kg', current_stock: 25, min_threshold: 10, cost_per_unit: 0.90,
    last_updated: '2026-06-14T07:00:00Z',
    transactions: [
      { id: 'r1', date: '2026-06-14T07:00:00Z', quantity_change: -5, reason: 'production', note: 'Used for morning batch', performed_by: 'Kitchen' },
      { id: 'r2', date: '2026-06-13T08:00:00Z', quantity_change: +30, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r3', date: '2026-06-13T07:00:00Z', quantity_change: -6, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r4', date: '2026-06-12T08:00:00Z', quantity_change: +25, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r5', date: '2026-06-12T07:00:00Z', quantity_change: -0.5, reason: 'waste', note: 'Contaminated bag', performed_by: 'Kitchen' },
    ],
  },
  {
    id: 'rm2',
    name: { en: 'Sugar', lo: 'ນ້ຳຕານ', th: 'น้ำตาล', zh: '糖' },
    unit: 'kg', current_stock: 8, min_threshold: 5, cost_per_unit: 1.10,
    last_updated: '2026-06-14T07:30:00Z',
    transactions: [
      { id: 'r6', date: '2026-06-14T07:30:00Z', quantity_change: -2, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r7', date: '2026-06-13T09:00:00Z', quantity_change: +10, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r8', date: '2026-06-13T07:30:00Z', quantity_change: -2.5, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r9', date: '2026-06-12T09:00:00Z', quantity_change: +10, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r10', date: '2026-06-12T07:30:00Z', quantity_change: -2, reason: 'production', performed_by: 'Kitchen' },
    ],
  },
  {
    id: 'rm3',
    name: { en: 'Eggs', lo: 'ໄຂ່', th: 'ไข่', zh: '鸡蛋' },
    unit: 'pcs', current_stock: 3, min_threshold: 24, cost_per_unit: 0.20,
    last_updated: '2026-06-14T09:00:00Z',
    transactions: [
      { id: 'r11', date: '2026-06-14T09:00:00Z', quantity_change: -30, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r12', date: '2026-06-14T07:00:00Z', quantity_change: +60, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r13', date: '2026-06-13T09:00:00Z', quantity_change: -25, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r14', date: '2026-06-13T07:00:00Z', quantity_change: +60, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r15', date: '2026-06-12T09:00:00Z', quantity_change: -2, reason: 'waste', note: 'Cracked', performed_by: 'Kitchen' },
    ],
  },
  {
    id: 'rm4',
    name: { en: 'Butter / Margarine', lo: 'ມັນເນີ / ມາກາຣີນ', th: 'เนย/มาการีน', zh: '黄油/人造黄油' },
    unit: 'kg', current_stock: 4.5, min_threshold: 2, cost_per_unit: 3.50,
    last_updated: '2026-06-14T07:00:00Z',
    transactions: [
      { id: 'r16', date: '2026-06-14T07:00:00Z', quantity_change: -0.5, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r17', date: '2026-06-13T09:00:00Z', quantity_change: +5, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r18', date: '2026-06-13T07:00:00Z', quantity_change: -0.6, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r19', date: '2026-06-12T09:00:00Z', quantity_change: +5, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r20', date: '2026-06-12T07:00:00Z', quantity_change: -0.5, reason: 'production', performed_by: 'Kitchen' },
    ],
  },
  {
    id: 'rm5',
    name: { en: 'Fresh Milk', lo: 'ນົມສົດ', th: 'นมสด', zh: '鲜奶' },
    unit: 'L', current_stock: 12, min_threshold: 5, cost_per_unit: 1.80,
    last_updated: '2026-06-14T07:00:00Z',
    transactions: [
      { id: 'r21', date: '2026-06-14T07:00:00Z', quantity_change: -3, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r22', date: '2026-06-14T06:00:00Z', quantity_change: +15, reason: 'restock', note: 'Daily delivery', performed_by: 'Staff A' },
      { id: 'r23', date: '2026-06-13T07:00:00Z', quantity_change: -4, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r24', date: '2026-06-13T06:00:00Z', quantity_change: +15, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r25', date: '2026-06-12T17:00:00Z', quantity_change: -0.5, reason: 'waste', note: 'Expired', performed_by: 'Staff B' },
    ],
  },
  {
    id: 'rm6',
    name: { en: 'Instant Yeast', lo: 'ຍີສ', th: 'ยีสต์', zh: '酵母' },
    unit: 'g', current_stock: 350, min_threshold: 100, cost_per_unit: 0.025,
    last_updated: '2026-06-14T07:00:00Z',
    transactions: [
      { id: 'r26', date: '2026-06-14T07:00:00Z', quantity_change: -50, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r27', date: '2026-06-13T09:00:00Z', quantity_change: +500, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r28', date: '2026-06-13T07:00:00Z', quantity_change: -50, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r29', date: '2026-06-12T09:00:00Z', quantity_change: +500, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r30', date: '2026-06-12T07:00:00Z', quantity_change: -50, reason: 'production', performed_by: 'Kitchen' },
    ],
  },
  {
    id: 'rm7',
    name: { en: 'Salt', lo: 'ເກືອ', th: 'เกลือ', zh: '盐' },
    unit: 'g', current_stock: 800, min_threshold: 200, cost_per_unit: 0.002,
    last_updated: '2026-06-13T09:00:00Z',
    transactions: [
      { id: 'r31', date: '2026-06-14T07:00:00Z', quantity_change: -30, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r32', date: '2026-06-13T09:00:00Z', quantity_change: +1000, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r33', date: '2026-06-13T07:00:00Z', quantity_change: -30, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r34', date: '2026-06-12T09:00:00Z', quantity_change: +500, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r35', date: '2026-06-12T07:00:00Z', quantity_change: -30, reason: 'production', performed_by: 'Kitchen' },
    ],
  },
  {
    id: 'rm8',
    name: { en: 'Chicken (Boneless)', lo: 'ຊີ້ນໄກ່ (ບໍ່ມີກະດູກ)', th: 'ไก่ไม่ติดกระดูก', zh: '去骨鸡肉' },
    unit: 'kg', current_stock: 3, min_threshold: 4, cost_per_unit: 6.50,
    last_updated: '2026-06-14T08:00:00Z',
    transactions: [
      { id: 'r36', date: '2026-06-14T08:00:00Z', quantity_change: -2, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r37', date: '2026-06-14T06:00:00Z', quantity_change: +5, reason: 'restock', note: 'From supplier', performed_by: 'Staff A' },
      { id: 'r38', date: '2026-06-13T08:00:00Z', quantity_change: -3, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r39', date: '2026-06-13T06:00:00Z', quantity_change: +6, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r40', date: '2026-06-12T17:00:00Z', quantity_change: -0.5, reason: 'waste', note: 'Expired', performed_by: 'Staff B' },
    ],
  },
  {
    id: 'rm9',
    name: { en: 'BBQ Pork (Char Siu)', lo: 'ໝູ BBQ', th: 'หมูบาร์บีคิว', zh: '叉烧肉' },
    unit: 'kg', current_stock: 0, min_threshold: 3, cost_per_unit: 8.00,
    last_updated: '2026-06-14T09:00:00Z',
    transactions: [
      { id: 'r41', date: '2026-06-14T09:00:00Z', quantity_change: -2, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r42', date: '2026-06-14T06:00:00Z', quantity_change: +2, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r43', date: '2026-06-13T09:00:00Z', quantity_change: -2.5, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r44', date: '2026-06-13T06:00:00Z', quantity_change: +4, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r45', date: '2026-06-12T17:00:00Z', quantity_change: -0.2, reason: 'waste', note: 'Trim waste', performed_by: 'Kitchen' },
    ],
  },
  {
    id: 'rm10',
    name: { en: 'Mixed Vegetables', lo: 'ຜັກລວມ', th: 'ผักรวม', zh: '什锦蔬菜' },
    unit: 'kg', current_stock: 6.5, min_threshold: 2, cost_per_unit: 2.00,
    last_updated: '2026-06-14T07:30:00Z',
    transactions: [
      { id: 'r46', date: '2026-06-14T07:30:00Z', quantity_change: -1.5, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r47', date: '2026-06-14T06:00:00Z', quantity_change: +8, reason: 'restock', note: 'Daily market purchase', performed_by: 'Staff A' },
      { id: 'r48', date: '2026-06-13T07:30:00Z', quantity_change: -2, reason: 'production', performed_by: 'Kitchen' },
      { id: 'r49', date: '2026-06-13T06:00:00Z', quantity_change: +8, reason: 'restock', performed_by: 'Staff A' },
      { id: 'r50', date: '2026-06-12T17:00:00Z', quantity_change: -0.5, reason: 'waste', note: 'Wilted', performed_by: 'Staff B' },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function getStatus(item: InventoryItem): StockStatus {
  if (item.current_stock <= 0) return 'out_of_stock'
  if (item.current_stock < item.min_threshold) return 'low_stock'
  return 'in_stock'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatStock(value: number, unit: Unit): string {
  const rounded = Number.isInteger(value) ? value : +value.toFixed(2)
  return `${rounded} ${unit}`
}

const STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string; Icon: typeof CheckCircle }> = {
  in_stock:     { label: 'In Stock',     color: '#16a34a', bg: 'rgba(22,163,74,0.15)',  Icon: CheckCircle },
  low_stock:    { label: 'Low Stock',    color: '#ca8a04', bg: 'rgba(202,138,4,0.15)',  Icon: AlertTriangle },
  out_of_stock: { label: 'Out of Stock', color: '#dc2626', bg: 'rgba(220,38,38,0.15)',  Icon: AlertTriangle },
}

const REASON_LABELS: Record<TransactionReason, string> = {
  restock:    'Restock',
  waste:      'Waste',
  sale:       'Sale',
  correction: 'Correction',
  production: 'Production',
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ item }: { item: InventoryItem }) {
  const status = getStatus(item)
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <cfg.Icon size={11} />
      {cfg.label}
    </span>
  )
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isPositive = tx.quantity_change > 0
  return (
    <div
      className="flex items-center gap-3 py-2 text-xs"
      style={{ borderBottom: '1px solid var(--border-col)' }}
    >
      <span style={{ color: 'var(--text-muted-col)', minWidth: 110 }}>{formatDate(tx.date)}</span>
      <span
        className="font-bold w-16 text-right"
        style={{ color: isPositive ? 'var(--cta-success)' : '#f87171' }}
      >
        {isPositive ? '+' : ''}{tx.quantity_change}
      </span>
      <span
        className="px-1.5 py-0.5 rounded text-xs font-medium"
        style={{
          background: isPositive ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
          color: isPositive ? 'var(--cta-success)' : '#f87171',
        }}
      >
        {REASON_LABELS[tx.reason]}
      </span>
      {tx.note && (
        <span style={{ color: 'var(--text-muted-col)' }} className="truncate">{tx.note}</span>
      )}
      <span className="ml-auto" style={{ color: 'var(--text-muted-col)' }}>{tx.performed_by}</span>
    </div>
  )
}

// ── Adjust Stock Modal ─────────────────────────────────────────────────────────
interface AdjustModalProps {
  item: InventoryItem
  onClose: () => void
  onSave: (id: string, newStock: number, reason: TransactionReason, note: string) => void
}

function AdjustModal({ item, onClose, onSave }: AdjustModalProps) {
  const [mode, setMode] = useState<'set' | 'adjust'>('adjust')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState<TransactionReason>('restock')
  const [note, setNote] = useState('')

  const numVal = parseFloat(value) || 0

  const previewStock = mode === 'set'
    ? numVal
    : item.current_stock + numVal

  const handleSave = () => {
    const newStock = Math.max(0, mode === 'set' ? numVal : item.current_stock + numVal)
    onSave(item.id, newStock, reason, note)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-2xl w-full max-w-md shadow-2xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-col)' }}
        >
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-col)' }}>
              Adjust Stock
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
              {item.name.en}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted-col)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current stock */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-muted-col)' }}>Current Stock</span>
            <span className="font-bold text-lg" style={{ color: 'var(--text-col)' }}>
              {formatStock(item.current_stock, item.unit)}
            </span>
          </div>

          {/* Mode toggle */}
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border-col)' }}
          >
            {(['adjust', 'set'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={{
                  background: mode === m ? 'var(--cta-primary)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted-col)',
                }}
              >
                {m === 'adjust' ? '+/− Adjust' : 'Set Exact'}
              </button>
            ))}
          </div>

          {/* Quantity input */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted-col)' }}>
              {mode === 'adjust' ? 'Quantity Change' : 'New Quantity'} ({item.unit})
            </label>
            <div className="flex items-center gap-2">
              {mode === 'adjust' && (
                <button
                  onClick={() => setValue(v => String((parseFloat(v) || 0) - 1))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ background: 'rgba(220,38,38,0.15)', color: '#f87171' }}
                >
                  <Minus size={16} />
                </button>
              )}
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={mode === 'adjust' ? '0' : String(item.current_stock)}
                className="flex-1 rounded-xl px-3 py-2.5 text-center text-lg font-bold outline-none focus:ring-2 transition-all"
                style={{
                  background: 'var(--main-bg)',
                  border: '1px solid var(--border-col)',
                  color: 'var(--text-col)',
                }}
              />
              {mode === 'adjust' && (
                <button
                  onClick={() => setValue(v => String((parseFloat(v) || 0) + 1))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ background: 'rgba(22,163,74,0.15)', color: 'var(--cta-success)' }}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            {mode === 'adjust' && numVal !== 0 && (
              <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted-col)' }}>
                Preview: {item.current_stock} → <strong style={{ color: previewStock < 0 ? '#f87171' : 'var(--cta-success)' }}>{Math.max(0, previewStock)} {item.unit}</strong>
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted-col)' }}>
              Reason
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as TransactionReason)}
              className="w-full rounded-xl px-3 py-2.5 outline-none focus:ring-2 transition-all"
              style={{
                background: 'var(--main-bg)',
                border: '1px solid var(--border-col)',
                color: 'var(--text-col)',
              }}
            >
              <option value="restock">Restock</option>
              <option value="waste">Waste / Loss</option>
              <option value="sale">Manual Sale</option>
              <option value="correction">Correction</option>
              <option value="production">Production Use</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted-col)' }}>
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full rounded-xl px-3 py-2.5 outline-none focus:ring-2 transition-all"
              style={{
                background: 'var(--main-bg)',
                border: '1px solid var(--border-col)',
                color: 'var(--text-col)',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 pb-5"
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
            style={{ border: '1px solid var(--border-col)', color: 'var(--text-muted-col)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={value === '' || value === '0'}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--cta-primary)', color: '#fff' }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add / Edit Item Modal ──────────────────────────────────────────────────────
interface ItemModalProps {
  item?: InventoryItem
  onClose: () => void
  onSave: (item: Omit<InventoryItem, 'id' | 'last_updated' | 'transactions'>) => void
}

const BLANK_FORM = {
  name: { en: '', lo: '', th: '', zh: '' } as { en: string; lo: string; th: string; zh: string },
  unit: 'pcs' as Unit,
  current_stock: 0,
  min_threshold: 0,
  cost_per_unit: 0,
}

function ItemModal({ item, onClose, onSave }: ItemModalProps) {
  const [form, setForm] = useState(
    item
      ? {
          name: { en: item.name.en ?? '', lo: item.name.lo ?? '', th: item.name.th ?? '', zh: item.name.zh ?? '' },
          unit: item.unit,
          current_stock: item.current_stock,
          min_threshold: item.min_threshold,
          cost_per_unit: item.cost_per_unit,
        }
      : BLANK_FORM,
  )

  const setField = (key: keyof typeof form, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }))
  const setName = (lang: 'en' | 'lo' | 'th' | 'zh', val: string) =>
    setForm(f => ({ ...f, name: { ...f.name, [lang]: val } }))

  const isValid = form.name.en.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-col)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{
            background: 'var(--card-bg)',
            borderBottom: '1px solid var(--border-col)',
          }}
        >
          <h3 className="font-bold text-base" style={{ color: 'var(--text-col)' }}>
            {item ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted-col)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name fields */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--cta-primary)' }}>
              Item Name (all languages)
            </p>
            <div className="space-y-2">
              {([['en', 'English'], ['lo', 'ລາວ'], ['th', 'ภาษาไทย'], ['zh', '中文']] as const).map(([lang, label]) => (
                <div key={lang} className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold w-8 text-center rounded-md py-1"
                    style={{ background: 'var(--main-bg)', color: 'var(--text-muted-col)' }}
                  >
                    {lang.toUpperCase()}
                  </span>
                  <input
                    type="text"
                    value={form.name[lang]}
                    onChange={e => setName(lang, e.target.value)}
                    placeholder={label}
                    className="flex-1 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 transition-all"
                    style={{
                      background: 'var(--main-bg)',
                      border: lang === 'en' ? '1px solid var(--cta-primary)' : '1px solid var(--border-col)',
                      color: 'var(--text-col)',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted-col)' }}>Unit</label>
            <select
              value={form.unit}
              onChange={e => setField('unit', e.target.value as Unit)}
              className="w-full rounded-xl px-3 py-2.5 outline-none focus:ring-2 transition-all"
              style={{
                background: 'var(--main-bg)',
                border: '1px solid var(--border-col)',
                color: 'var(--text-col)',
              }}
            >
              {(['pcs', 'box', 'pack', 'kg', 'g', 'L', 'ml', 'bottle'] as Unit[]).map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-3 gap-3">
            {([
              ['current_stock', 'Current Stock'],
              ['min_threshold', 'Min Threshold'],
              ['cost_per_unit', 'Cost / Unit ($)'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted-col)' }}>{label}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form[key]}
                  onChange={e => setField(key, parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl px-3 py-2.5 outline-none focus:ring-2 transition-all"
                  style={{
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-col)',
                    color: 'var(--text-col)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex gap-3 px-5 pb-5"
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
            style={{ border: '1px solid var(--border-col)', color: 'var(--text-muted-col)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (isValid) { onSave(form); onClose() } }}
            disabled={!isValid}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--cta-primary)', color: '#fff' }}
          >
            {item ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inventory Table ────────────────────────────────────────────────────────────
interface InventoryTableProps {
  items: InventoryItem[]
  onAdjust: (item: InventoryItem) => void
  onEdit: (item: InventoryItem) => void
  expandedHistory: Set<string>
  onToggleHistory: (id: string) => void
}

function InventoryTable({ items, onAdjust, onEdit, expandedHistory, onToggleHistory }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--text-muted-col)' }}>
        <Package size={40} strokeWidth={1.5} />
        <p className="text-sm">No items found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-col)' }}>
            {['Item Name', 'Current Stock', 'Unit', 'Min. Threshold', 'Last Updated', 'Status', 'Actions'].map(h => (
              <th
                key={h}
                className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-muted-col)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const status = getStatus(item)
            const isLow = status === 'low_stock'
            const isOut = status === 'out_of_stock'
            const showHistory = expandedHistory.has(item.id)

            return (
              <>
                <tr
                  key={item.id}
                  style={{
                    borderBottom: showHistory ? 'none' : '1px solid var(--border-col)',
                    background: isOut
                      ? 'rgba(220,38,38,0.04)'
                      : isLow
                      ? 'rgba(202,138,4,0.06)'
                      : 'transparent',
                  }}
                >
                  {/* Name */}
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-col)' }}>{item.name.en}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
                        {item.name.lo}
                      </p>
                    </div>
                  </td>

                  {/* Current stock */}
                  <td className="py-3 px-4">
                    <span
                      className="font-bold text-base"
                      style={{
                        color: isOut ? '#f87171' : isLow ? '#fbbf24' : 'var(--text-col)',
                      }}
                    >
                      {formatStock(item.current_stock, item.unit).split(' ')[0]}
                    </span>
                  </td>

                  {/* Unit */}
                  <td className="py-3 px-4">
                    <span
                      className="text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{ background: 'var(--main-bg)', color: 'var(--text-muted-col)', border: '1px solid var(--border-col)' }}
                    >
                      {item.unit}
                    </span>
                  </td>

                  {/* Min threshold */}
                  <td className="py-3 px-4" style={{ color: 'var(--text-muted-col)' }}>
                    {item.min_threshold} {item.unit}
                  </td>

                  {/* Last updated */}
                  <td className="py-3 px-4" style={{ color: 'var(--text-muted-col)' }}>
                    <span className="text-xs">{formatDate(item.last_updated)}</span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge item={item} />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onAdjust(item)}
                        title="Adjust stock"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                        style={{ background: 'var(--cta-primary)', color: '#fff' }}
                      >
                        <Plus size={13} />
                        Adjust
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        title="Edit item"
                        className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                        style={{ color: 'var(--text-muted-col)' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onToggleHistory(item.id)}
                        title="View history"
                        className="p-1.5 rounded-lg transition-colors hover:bg-white/10 flex items-center gap-1"
                        style={{ color: showHistory ? 'var(--cta-primary)' : 'var(--text-muted-col)' }}
                      >
                        <History size={14} />
                        {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Transaction history */}
                {showHistory && (
                  <tr key={`${item.id}-history`} style={{ borderBottom: '1px solid var(--border-col)' }}>
                    <td colSpan={7} className="px-6 pb-3 pt-0">
                      <div
                        className="rounded-xl p-3"
                        style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)' }}
                      >
                        <p
                          className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                          style={{ color: 'var(--text-muted-col)' }}
                        >
                          <History size={12} />
                          Last 5 Transactions
                        </p>
                        {item.transactions.slice(0, 5).map(tx => (
                          <TransactionRow key={tx.id} tx={tx} />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabId>('finished')
  const [search, setSearch] = useState('')
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set())

  // Data state
  const [finishedGoods, setFinishedGoods] = useState<InventoryItem[]>(FINISHED_GOODS)
  const [rawMaterials, setRawMaterials] = useState<InventoryItem[]>(RAW_MATERIALS)

  // Modal state
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null)
  const [itemModalTarget, setItemModalTarget] = useState<InventoryItem | 'new' | null>(null)

  const items = activeTab === 'finished' ? finishedGoods : rawMaterials
  const setItems = activeTab === 'finished' ? setFinishedGoods : setRawMaterials

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      i =>
        (i.name.en ?? '').toLowerCase().includes(q) ||
        (i.name.lo ?? '').includes(q) ||
        (i.name.th ?? '').toLowerCase().includes(q),
    )
  }, [items, search])

  // Summary stats
  const stats = useMemo(() => ({
    total: items.length,
    inStock:    items.filter(i => getStatus(i) === 'in_stock').length,
    lowStock:   items.filter(i => getStatus(i) === 'low_stock').length,
    outOfStock: items.filter(i => getStatus(i) === 'out_of_stock').length,
  }), [items])

  const toggleHistory = (id: string) =>
    setExpandedHistory(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleAdjustSave = (id: string, newStock: number, reason: TransactionReason, note: string) => {
    const now = new Date().toISOString()
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        const change = newStock - item.current_stock
        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          date: now,
          quantity_change: change,
          reason,
          note: note || undefined,
          performed_by: 'Manager',
        }
        return {
          ...item,
          current_stock: newStock,
          last_updated: now,
          transactions: [newTx, ...item.transactions],
        }
      }),
    )
  }

  const handleItemSave = (data: Omit<InventoryItem, 'id' | 'last_updated' | 'transactions'>) => {
    if (itemModalTarget === 'new') {
      const newItem: InventoryItem = {
        ...data,
        id: `item-${Date.now()}`,
        last_updated: new Date().toISOString(),
        transactions: [],
      }
      setItems(prev => [...prev, newItem])
    } else if (itemModalTarget) {
      const now = new Date().toISOString()
      setItems(prev =>
        prev.map(i =>
          i.id === itemModalTarget.id
            ? { ...i, ...data, last_updated: now }
            : i,
        ),
      )
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--main-bg)' }}>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text-col)' }}>
          <Package size={24} style={{ color: 'var(--cta-primary)' }} />
          Inventory Management
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted-col)' }}>
          ການຈັດການສາງ / การจัดการคลังสินค้า
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Items',    value: stats.total,      color: 'var(--cta-primary)', bg: 'rgba(249,115,22,0.12)' },
          { label: 'In Stock',       value: stats.inStock,    color: 'var(--cta-success)', bg: 'rgba(22,163,74,0.12)' },
          { label: 'Low Stock',      value: stats.lowStock,   color: '#ca8a04',            bg: 'rgba(202,138,4,0.12)' },
          { label: 'Out of Stock',   value: stats.outOfStock, color: 'var(--cta-danger)',  bg: 'rgba(220,38,38,0.12)' },
        ].map(card => (
          <div
            key={card.label}
            className="rounded-2xl px-4 py-4 flex flex-col gap-1"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted-col)' }}>{card.label}</span>
            <span className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</span>
            <div className="h-1 w-full rounded-full mt-1" style={{ background: card.bg }}>
              <div
                className="h-1 rounded-full"
                style={{
                  width: stats.total > 0 ? `${(card.value / stats.total) * 100}%` : '0%',
                  background: card.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div
        className="rounded-2xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
      >
        {/* Tabs + actions */}
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 pt-5 pb-0"
          style={{ borderBottom: '1px solid var(--border-col)' }}
        >
          {/* Tabs */}
          <div className="flex gap-0">
            {([
              { id: 'finished', label: 'Finished Goods', sub: 'ສິນຄ້າ / สินค้า' },
              { id: 'raw',      label: 'Raw Materials',  sub: 'ວັດຖຸດິບ / วัตถุดิบ' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch('') }}
                className="relative flex flex-col items-start px-4 pb-3 pt-1 transition-colors"
                style={{ color: activeTab === tab.id ? 'var(--cta-primary)' : 'var(--text-muted-col)' }}
              >
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className="text-xs opacity-70">{tab.sub}</span>
                {activeTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ background: 'var(--cta-primary)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Spacer + search + add */}
          <div className="sm:ml-auto flex items-center gap-2 pb-3">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)', minWidth: 200 }}
            >
              <Search size={14} style={{ color: 'var(--text-muted-col)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items..."
                className="bg-transparent text-sm outline-none flex-1"
                style={{ color: 'var(--text-col)' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted-col)' }}>
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={() => setItemModalTarget('new')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 whitespace-nowrap"
              style={{ background: 'var(--cta-primary)', color: '#fff' }}
            >
              <Plus size={15} />
              Add Item
            </button>
          </div>
        </div>

        {/* Table */}
        <InventoryTable
          items={filtered}
          onAdjust={setAdjustTarget}
          onEdit={item => setItemModalTarget(item)}
          expandedHistory={expandedHistory}
          onToggleHistory={toggleHistory}
        />

        {/* Footer count */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border-col)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted-col)' }}>
            Showing {filtered.length} of {items.length} items
          </p>
          {stats.lowStock + stats.outOfStock > 0 && (
            <p
              className="text-xs flex items-center gap-1.5 font-medium"
              style={{ color: '#fbbf24' }}
            >
              <AlertTriangle size={12} />
              {stats.lowStock + stats.outOfStock} item{stats.lowStock + stats.outOfStock > 1 ? 's' : ''} need attention
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      {adjustTarget && (
        <AdjustModal
          item={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSave={handleAdjustSave}
        />
      )}
      {itemModalTarget && (
        <ItemModal
          item={itemModalTarget === 'new' ? undefined : itemModalTarget}
          onClose={() => setItemModalTarget(null)}
          onSave={handleItemSave}
        />
      )}
    </div>
  )
}
