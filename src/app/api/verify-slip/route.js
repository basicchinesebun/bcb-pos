export async function POST(req) {
  try {
    const { slipUrl, expectedAmount } = await req.json()
    if (!slipUrl || !expectedAmount) {
      return Response.json({ error: 'Missing slipUrl or expectedAmount' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Vientiane'
    })

    const prompt = `You are verifying a bank transfer slip for a restaurant order in Laos.
Today's date is ${today} (DD/MM/YYYY, Vientiane time).
The expected payment amount is ${expectedAmount.toLocaleString()} LAK (Lao Kip).

Analyze this payment slip image and reply with ONLY a JSON object (no markdown, no extra text):
{
  "amount_found": <number or null — extracted amount in LAK>,
  "transfer_date": "<date string as shown in slip, or null>",
  "date_is_today": <true/false — whether the transfer date matches today ${today}>,
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

    const data = await anthropicRes.json()
    const raw = data.content?.[0]?.text || '{}'
    const result = JSON.parse(raw)
    return Response.json({ ok: true, result })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
