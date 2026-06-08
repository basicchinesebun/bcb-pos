import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const { slipUrl, expectedAmount, orderId } = await req.json()
    if (!slipUrl || expectedAmount == null) {
      return Response.json({ error: 'Missing slipUrl or expectedAmount' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const todayISO = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Check + update daily limit (only when orderId provided — counted checks)
    let dailyCount = 0
    let dailyLimit = 100
    if (orderId) {
      const [limitRow, countRow] = await Promise.all([
        supabase.from('shop_config').select('value').eq('key', 'slip_verify_limit').single(),
        supabase.from('shop_config').select('value').eq('key', 'slip_verify_today').single(),
      ])

      dailyLimit = parseInt(limitRow.data?.value || '100')
      let todayData = { date: todayISO, count: 0 }
      if (countRow.data?.value) {
        try { todayData = JSON.parse(countRow.data.value) } catch {}
        if (todayData.date !== todayISO) todayData = { date: todayISO, count: 0 }
      }
      dailyCount = todayData.count

      if (dailyCount >= dailyLimit) {
        return Response.json({ ok: false, limitReached: true, count: dailyCount, limit: dailyLimit }, { status: 429 })
      }

      await supabase.from('shop_config').upsert(
        { key: 'slip_verify_today', value: JSON.stringify({ date: todayISO, count: dailyCount + 1 }) },
        { onConflict: 'key' }
      )
    }

    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Vientiane',
    })

    const prompt = `You are verifying a bank transfer slip for a restaurant order in Laos.
Today's date is ${todayFormatted} (DD/MM/YYYY, Vientiane time).
The expected payment amount is ${expectedAmount.toLocaleString()} LAK (Lao Kip).

Analyze this payment slip image and reply with ONLY a JSON object (no markdown, no extra text):
{
  "amount_found": <number or null — extracted amount in LAK>,
  "transfer_date": "<date string as shown in slip, or null>",
  "date_is_today": <true/false — whether the transfer date matches today ${todayFormatted}>,
  "amount_matches": <true/false — whether amount_found equals ${expectedAmount}>,
  "suspicious": <true/false — does the image look potentially edited or fake?>,
  "suspicious_reason": "<if suspicious, explain briefly; else null>",
  "confidence": "<high|medium|low>",
  "summary_lo": "<1–2 sentence assessment in Lao language>"
}`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: slipUrl } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      return Response.json({ error: 'Anthropic API error: ' + err }, { status: 500 })
    }

    const aiData = await anthropicRes.json()
    const raw = aiData.content?.[0]?.text || '{}'
    const result = JSON.parse(raw)

    // Persist result to shop_config when orderId provided
    if (orderId) {
      const { data: resultsRow } = await supabase.from('shop_config').select('value').eq('key', 'slip_verify_results').single()
      let results = {}
      if (resultsRow?.value) { try { results = JSON.parse(resultsRow.value) } catch {} }
      results[orderId] = { ...result, checked_at: new Date().toISOString() }
      // Keep last 500 results
      const entries = Object.entries(results)
        .sort((a, b) => new Date(b[1].checked_at) - new Date(a[1].checked_at))
        .slice(0, 500)
      await supabase.from('shop_config').upsert(
        { key: 'slip_verify_results', value: JSON.stringify(Object.fromEntries(entries)) },
        { onConflict: 'key' }
      )
    }

    return Response.json({ ok: true, result, count: dailyCount + (orderId ? 1 : 0), limit: dailyLimit })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
