const SYSTEM = `You are BCB Office AI — a bilingual secretary for Basic Chinese Bun restaurant in Laos.
You manage: orders, payment slips, branches, inventory, and system settings.

CRITICAL: Always reply in the SAME language the user wrote in (Thai → Thai, Lao → Lao). Never switch to English unless explicitly asked.

You MUST return a single valid JSON object — nothing else before or after:
{"reply":"your message","actions":[]}

Available actions (only use when explicitly requested):
- Confirm order:      {"type":"confirm_order","orderId":"<uuid>","qnum":<n>}
- Reject order:       {"type":"reject_order","orderId":"<uuid>","qnum":<n>}
- Open branch:        {"type":"toggle_branch","id":"simeuang","visible":true}
- Close branch:       {"type":"toggle_branch","id":"houayhong","visible":false}
- Toggle AI:          {"type":"toggle_setting","key":"aiOn","value":true}
- Toggle online:      {"type":"toggle_setting","key":"onlineOn","value":true}
- Toggle walk-in:     {"type":"toggle_setting","key":"walkinOn","value":true}
- Verify all slips:   {"type":"verify_all_slips"}
- Create walk-in:     {"type":"create_walkin_order","items":[{"menuIdx":0,"name":"...","qty":2,"price":28000,"sub":56000}],"total":56000,"customerName":"ສົມ","paymentMethod":"cash"}
- Edit order items:   {"type":"update_order_items","orderId":"<uuid>","qnum":<n>,"items":[{"menuIdx":0,"name":"...","qty":2,"price":28000,"sub":56000}],"total":<new_total>}

Rules for CREATE WALK-IN:
1. Match menu items from the MENU LIST below by name (fuzzy match — e.g. "หมู" matches "ໄສ້ຫມູ")
2. Use exact menuIdx, name, and price from the menu list
3. sub = price × qty, total = sum of all sub
4. paymentMethod: "cash" (ເງິນສົດ) or "transfer" (ໂອນ)
5. customerName is optional

Rules for EDIT ORDER:
1. Identify order by qnum or customer name from the order list
2. Return FULL new items array (not just changed items)
3. Recalculate total from new items

General rules:
- Only take actions when user EXPLICITLY asks
- Always confirm what action you took in reply
- If order is ambiguous, list matches and ask
- Be concise — 1-3 sentences max unless listing data`

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ reply: '⚠️ ຍັງບໍ່ໄດ້ຕັ້ງ ANTHROPIC_API_KEY ໃນ Vercel', actions: [] })
  }

  try {
    const { messages, context } = await req.json()
    const { orders = [], settings = {}, branches = [], stats = {}, menus = [], prices = [], stockShop = [] } = context

    const pending = orders.filter(o => o.type === 'online' && o.status === 'pending' && !o.done && !o.cancelled)
    const pendingSlips = pending.filter(o => o.slip_url)
    const allPending = orders.filter(o => !o.done && !o.cancelled && o.status !== 'rejected')

    function custName(o) {
      try {
        const c = o.customer ? (typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer) : null
        return c?.name || '-'
      } catch { return '-' }
    }

    const menuList = menus.map((m, i) => {
      const name = typeof m === 'object' ? (m.lo || m.name || '') : String(m)
      const nameEn = typeof m === 'object' ? (m.en || '') : ''
      return `  [${i}] ${name}${nameEn ? ' / '+nameEn : ''} | ${(prices[i]||0).toLocaleString()} kip | stock: ${stockShop[i]||0}`
    }).join('\n')

    const ctx = `
=== BCB Shop Live Data ===
Time: ${new Date().toLocaleString('lo-LA')}
Today orders: ${stats.todayCount || 0} (done: ${stats.doneCount || 0}, pending: ${stats.pendingOnline || 0})
Revenue today: ${(stats.revenueToday || 0).toLocaleString()} kip | Month: ${(stats.revenueMonth || 0).toLocaleString()} kip

Branches:
${branches.map(b => `  ${b.id} | ${b.name}: ${b.visible !== false ? 'OPEN' : 'CLOSED'} | tel: ${b.phone1 || 'none'}`).join('\n')}

Settings: AI=${settings.aiOn !== false ? 'ON' : 'OFF'} | Online=${settings.onlineOn !== false ? 'ON' : 'OFF'} | Walkin=${settings.walkinOn !== false ? 'ON' : 'OFF'}

MENU LIST (use menuIdx for item identification):
${menuList || '  (no menus loaded)'}

All active orders (${allPending.length} total):
${allPending.slice(0, 25).map(o => `  #${String(o.qnum||0).padStart(4,'0')} | ${o.type} | ${(o.total||0).toLocaleString()}kip | ${custName(o)} | status:${o.status} | id:${o.id}`).join('\n')}

Pending online with slip: ${pendingSlips.length}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM + '\n\n' + ctx,
        messages: messages.slice(-12),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return Response.json({ reply: `❌ API error: ${data.error?.message || res.status}`, actions: [] })
    }

    const raw = data.content?.[0]?.text || ''

    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        return Response.json({ reply: parsed.reply || raw, actions: Array.isArray(parsed.actions) ? parsed.actions : [] })
      } catch { /* fall through */ }
    }

    return Response.json({ reply: raw, actions: [] })
  } catch (err) {
    return Response.json({ reply: `❌ ${err.message}`, actions: [] }, { status: 500 })
  }
}
