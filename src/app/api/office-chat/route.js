const SYSTEM = `You are BCB Office AI — a bilingual secretary for Basic Chinese Bun restaurant in Laos.
You manage: orders, payment slips, branches, inventory alerts, and system settings.

CRITICAL: Always reply in the SAME language the user wrote in (Thai → Thai, Lao → Lao). Never switch to English unless explicitly asked.

You MUST return a single valid JSON object — nothing else before or after:
{"reply":"your message","actions":[]}

Available actions (only use when explicitly requested by user):
- Confirm order:   {"type":"confirm_order","orderId":"<uuid>","qnum":<number>}
- Reject order:    {"type":"reject_order","orderId":"<uuid>","qnum":<number>}
- Open branch:     {"type":"toggle_branch","id":"simeuang","visible":true}
- Close branch:    {"type":"toggle_branch","id":"houayhong","visible":false}
- Toggle AI:       {"type":"toggle_setting","key":"aiOn","value":true}
- Toggle online:   {"type":"toggle_setting","key":"onlineOn","value":true}
- Toggle walk-in:  {"type":"toggle_setting","key":"walkinOn","value":true}
- Verify all slips:{"type":"verify_all_slips"}

Rules:
1. Only take actions when user EXPLICITLY asks you to do something
2. To identify orders, match by qnum (#0329), customer name, or amount
3. Always confirm what action you took in reply
4. If you cannot identify a specific order, list the matching ones and ask
5. For multiple actions, include all in the actions array
6. Be concise — 1-3 sentences max unless listing data`

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ reply: '⚠️ ຍັງບໍ່ໄດ້ຕັ້ງ ANTHROPIC_API_KEY ໃນ Vercel', actions: [] })
  }

  try {
    const { messages, context } = await req.json()
    const { orders = [], settings = {}, branches = [], stats = {} } = context

    const pending = orders.filter(o => o.type === 'online' && o.status === 'pending' && !o.done && !o.cancelled)
    const pendingSlips = pending.filter(o => o.slip_url)

    function custName(o) {
      try {
        const c = o.customer ? (typeof o.customer === 'string' ? JSON.parse(o.customer) : o.customer) : null
        return c?.name || '-'
      } catch { return '-' }
    }

    const ctx = `
=== BCB Shop Live Data ===
Time: ${new Date().toLocaleString('lo-LA')}
Today orders: ${stats.todayCount || 0} (done: ${stats.doneCount || 0}, pending online: ${stats.pendingOnline || 0})
Revenue today: ${(stats.revenueToday || 0).toLocaleString()} kip | Month: ${(stats.revenueMonth || 0).toLocaleString()} kip

Branches:
${branches.map(b => `  ${b.id} | ${b.name}: ${b.visible !== false ? 'OPEN' : 'CLOSED'} | tel: ${b.phone1 || 'none'}`).join('\n')}

Settings: AI=${settings.aiOn !== false ? 'ON' : 'OFF'} | Online=${settings.onlineOn !== false ? 'ON' : 'OFF'} | Walkin=${settings.walkinOn !== false ? 'ON' : 'OFF'}

Pending online orders (${pending.length} total):
${pending.slice(0, 20).map(o => `  #${String(o.qnum || 0).padStart(4, '0')} | ${(o.total || 0).toLocaleString()}kip | ${custName(o)} | slip:${o.slip_url ? 'YES' : 'NO'} | id:${o.id}`).join('\n')}

Pending slips to verify: ${pendingSlips.length}`

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

    // Extract JSON from response
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
