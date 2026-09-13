import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Payment slips are 99% of this project's file storage, against a 1 GB free
// allowance. The staff page prunes them once a day too, but only while someone
// has it open — during a stretch where the till is off and everything is done
// from a phone, that never fires. This runs on Vercel's scheduler instead, so
// it happens whether or not anyone opened the app.
//
// Only the slip IMAGE goes. The order row — queue number, items, total,
// customer, sales history — is never touched.
const KEEP_DAYS = 14
const BUCKET = 'bcb - upload'

export async function GET(request) {
  // Vercel sends this header when CRON_SECRET is configured. If it isn't set,
  // the route stays open: the job is idempotent and can only ever remove slips
  // already past the retention window, so the worst an extra call does is
  // nothing.
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const cutoff = Date.now() - KEEP_DAYS * 86400000
  try {
    // Page through the folder — one list() call caps out and the tail would
    // never be pruned.
    const stale = []
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.storage.from(BUCKET)
        .list('slips', { limit: 500, offset, sortBy: { column: 'created_at', order: 'asc' } })
      if (error) throw error
      if (!data?.length) break
      for (const f of data) {
        const t = f.created_at ? new Date(f.created_at).getTime() : NaN
        if (!isNaN(t) && t < cutoff) stale.push('slips/' + f.name)
      }
      if (data.length < 500) break
    }

    if (!stale.length) return Response.json({ deleted: 0, keepDays: KEEP_DAYS })

    let deleted = 0
    for (let i = 0; i < stale.length; i += 100) {
      const batch = stale.slice(i, i + 100)
      const { error } = await supabase.storage.from(BUCKET).remove(batch)
      if (error) throw error
      deleted += batch.length
    }

    // Clear links that now point at nothing, so the slip gallery doesn't fill
    // with broken images.
    await supabase.from('orders').update({ slip_url: null })
      .lt('created_at', new Date(cutoff).toISOString())
      .not('slip_url', 'is', null)

    return Response.json({ deleted, keepDays: KEEP_DAYS })
  } catch (e) {
    return Response.json({ error: e?.message || 'prune failed' }, { status: 500 })
  }
}
