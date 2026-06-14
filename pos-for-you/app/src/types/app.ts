export type Lang = 'lo' | 'th' | 'en' | 'zh'
export type Theme = 'ocean' | 'warm'

export interface I18nText {
  lo?: string
  th?: string
  en?: string
  zh?: string
}

export interface MenuItem {
  id: string
  category_id: string | null
  name: I18nText
  description?: I18nText
  image_urls: string[]
  base_price: number
  is_available_walkin: boolean
  is_available_preorder: boolean
  is_bestseller: boolean
  tags: string[]
  is_active: boolean
}

export interface Category {
  id: string
  name: I18nText
  sort_order: number
}

export interface CartItem {
  id: string
  menu_item_id: string
  name: I18nText
  price: number
  quantity: number
  notes?: string
  image_url?: string
}

export interface Order {
  id: string
  queue_number: string
  order_type: 'walkin' | 'preorder'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'done' | 'cancelled' | 'rejected'
  customer_name?: string
  customer_phone?: string
  total: number
  currency: string
  payment_method?: string
  payment_status: 'unpaid' | 'paid' | 'refunded'
  created_at: string
}

export interface PreorderRound {
  id: string
  name: I18nText
  opens_at: string
  closes_at: string
  pickup_start?: string
  pickup_end?: string
  payment_options: string[]
  qr_image_url?: string
  status: 'draft' | 'open' | 'closed' | 'fulfilled' | 'cancelled'
}

export interface PreorderRoundItem {
  id: string
  menu_item_id: string
  price: number
  stock_limit: number | null
  reserved_count: number
  is_active: boolean
  menu_item?: MenuItem
}

export interface Shop {
  id: string
  slug: string
  name: I18nText
  description?: I18nText
  logo_url?: string
  banner_urls: string[]
  currency: string
  default_language: Lang
}

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'lo', label: 'ລາວ', flag: '🇱🇦' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

export function t(text: I18nText | undefined, lang: Lang): string {
  if (!text) return ''
  return text[lang] || text.en || text.lo || text.th || text.zh || ''
}
