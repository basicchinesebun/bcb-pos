import { createClient } from '@supabase/supabase-js'

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

let _supabase = null
function getSupabase() {
  if (!_supabase) _supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return _supabase
}

let _stockCache = null
let _stockCacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

export async function POST(req) {
  try {
    const body = await req.json()
    if (body.object !== 'page') return new Response('OK', { status: 200 })

    for (const entry of body.entry || []) {
      const event = entry.messaging?.[0]
      if (!event?.message?.text || event.message.is_echo) continue

      const senderId = event.sender.id
      const userMsg = event.message.text

      const stockInfo = await getStockInfo()
      const aiReply = await getClaudeReply(userMsg, stockInfo)
      await sendMessage(senderId, aiReply)
    }
  } catch (e) {
    console.error('webhook error:', e)
  }

  return new Response('OK', { status: 200 })
}

async function getStockInfo() {
  if (_stockCache && Date.now() - _stockCacheTime < CACHE_TTL) return _stockCache
  try {
    const { data } = await getSupabase()
      .from('shop_config')
      .select('key, value')
      .in('key', ['menus', 'prices', 'stock_online', 'settings'])

    const config = {}
    data?.forEach(row => { config[row.key] = JSON.parse(row.value) })

    const menus = config.menus || []
    const prices = config.prices || []
    const stock = config.stock_online || []
    const onlineOn = config.settings?.onlineOn !== false

    if (!onlineOn) { _stockCache = 'ຮ້ານປິດຮັບ Online ໃນຕອນນີ້'; _stockCacheTime = Date.now(); return _stockCache }

    _stockCache = menus.map((m, i) =>
      `- ${m.lo}: ${(stock[i] || 0) > 0 ? `${stock[i]} ຊິ້ນ (${(prices[i] || 0).toLocaleString()} ກີບ)` : 'ໝົດແລ້ວ'}`
    ).join('\n') || 'ບໍ່ມີຂໍ້ມູນສິນຄ້າ'
    _stockCacheTime = Date.now()
    return _stockCache
  } catch {
    return 'ບໍ່ສາມາດດຶງຂໍ້ມູນສິນຄ້າໄດ້'
  }
}

async function getClaudeReply(userMsg, stockInfo) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: buildSystemPrompt(stockInfo),
      messages: [{ role: 'user', content: userMsg }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text || 'ຂໍໂທດ ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່ 🙏🏻'
}

async function sendMessage(recipientId, text) {
  await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  })
}

function buildSystemPrompt(stockInfo) {
  return `ເຈົ້າແມ່ນຜູ້ຊ່ວຍຮ້ານ Basic Chinese Bun ຕອບພາສາລາວຫຼືໄທຕາມລູກຄ້າ ສຸພາບ ເປັນກັນເອງ

## ສິນຄ້າທີ່ມີຕອນນີ້ (real-time)
${stockInfo}

## ຂໍ້ມູນຮ້ານ
- ສາຂາ 1 ສີເມືອງ ເປີດ ຈັນ/ພຸດ/ສຸກ 15:00-19:30
- ສາຂາ 2 ຫວຍຫົງ ປິດຊົ່ວຄາວ
- ສັ່ງລ່ວງໜ້າ 1-2 ວັນ (ໃນວຽງຈັນ) / 3 ວັນ (ຕ່າງແຂວງ)
- ຮັບເຄື່ອງທີ່ຮ້ານເທົ່ານັ້ນ ບໍ່ມີ Rider ໃນເມືອງ
- ຊຳລະຜ່ານ BCEL OnePay ທາງຮ້ານຈະສົ່ງ QR ໃຫ້ຫຼັງຢືນຢັນ
- ບໍ່ມີລາຄາສົ່ງ ຊື້ລາຄາປົກກະຕິ ໄປຂາຍຕໍ່ໄດ້

## ສົ່ງຕ່າງແຂວງ
- ຄ່າ Rider ໄປສະໜາມບິນ/ຄິວລົດເມ 100,000 ກີບ (ລູກຄ້າຈ່າຍ)
- ສົ່ງທາງເຄື່ອງບິນ/ລົດໂດຍສານເທົ່ານັ້ນ

## ສິນຄ້າແບບເຢັນ
ບໍ່ແມ່ນແຊ່ແຂງ ເປັນສິນຄ້ານຶ່ງສຸກແລ້ວວາງໃຫ້ເຢັນ ລາຄາດຽວກັນ
ວິທີອຸ່ນ: ຕົ້ມນ້ຳເດືອດ 10-15 ນາທີ ຫ້າມເປີດຝາ / ໝໍ້ຫຸງເຂົ້າ / ໝໍ້ແດງ (ໄມໂຄເວບບໍ່ແນະນຳ)

## ສຳຄັນ
- ຖ້າລູກຄ້າຢືນຢັນສັ່ງ ໃຫ້ຕອບ: "ຮັບຊາບເລີຍ ທາງຮ້ານຈະຕິດຕໍ່ກັບມາພາຍໃນບໍ່ດົນ 🙏🏻"
- ຢ່າຮັບອໍເດີເອງ ໃຫ້ລໍຖ້າທາງຮ້ານຕິດຕໍ່
- ຖ້າສິນຄ້າໝົດ ໃຫ້ແຈ້ງລູກຄ້າທັນທີ
- ໃຊ້ 🙏🏻 ທ້າຍປະໂຫຍກ
- ຫ້າມໃຊ້ "ນະ" ທ້າຍປະໂຫຍກ
- ຫ້າມສອນ ຫຼື ບອກວິທີທຳ/ສູດ ທຸກກໍລະນີ`
}
