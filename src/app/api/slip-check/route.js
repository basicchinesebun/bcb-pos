import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file) return Response.json({ error: 'No file' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = file.type || 'image/jpeg'

    // Claude reads the slip
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
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: `Read this bank transfer slip. Reply ONLY with JSON (no markdown):
{
  "transaction_id": "<unique transaction/reference number>",
  "amount": <number>,
  "transfer_date": "<date and time as shown>",
  "sender_name": "<sender name>",
  "raw_text": "<all visible text>"
}
Use null for any field you cannot determine.` },
          ],
        }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      return Response.json({ error: 'Claude error: ' + err }, { status: 500 })
    }

    const aiData = await anthropicRes.json()
    const raw = aiData.content?.[0]?.text || '{}'
    let slipInfo
    try { slipInfo = JSON.parse(raw) } catch {
      return Response.json({ error: 'Could not parse slip', raw }, { status: 500 })
    }

    if (!slipInfo.transaction_id) {
      return Response.json({ ok: true, duplicate: false, slipInfo, warning: 'No transaction ID found' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: existing, error: selectErr } = await supabase
      .from('slip_records')
      .select('id, created_at, sender_name, amount')
      .eq('transaction_id', slipInfo.transaction_id)
      .single()

    // Table doesn't exist yet — return AI result with a setup warning
    if (selectErr?.code === '42P01') {
      return Response.json({ ok: true, duplicate: false, slipInfo, warning: 'slip_records table not created yet — duplicate detection disabled' })
    }

    if (existing) {
      return Response.json({ ok: true, duplicate: true, slipInfo, first_seen: existing.created_at, first_sender: existing.sender_name, first_amount: existing.amount })
    }

    const { error: insertErr } = await supabase.from('slip_records').insert({
      transaction_id: slipInfo.transaction_id,
      amount: slipInfo.amount,
      transfer_date: slipInfo.transfer_date,
      sender_name: slipInfo.sender_name,
      raw_text: slipInfo.raw_text,
    })

    if (insertErr) {
      return Response.json({ ok: true, duplicate: false, slipInfo, warning: 'Could not save slip record: ' + insertErr.message })
    }

    return Response.json({ ok: true, duplicate: false, slipInfo })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
