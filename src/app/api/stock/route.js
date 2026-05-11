import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shop_config')
      .select('key, value')
      .in('key', ['menus', 'prices', 'stock_online', 'settings'])

    if (error) throw error

    const config = {}
    data.forEach(row => { config[row.key] = JSON.parse(row.value) })

    const menus = config.menus || []
    const prices = config.prices || []
    const stock = config.stock_online || []
    const onlineOn = config.settings?.onlineOn !== false

    const items = menus.map((menu, i) => ({
      index: i,
      name_lo: menu.lo,
      name_en: menu.en,
      price: prices[i] || 0,
      stock: stock[i] || 0,
      available: onlineOn && (stock[i] || 0) > 0,
    }))

    return Response.json({ success: true, items, onlineOn })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
