import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbscoolodkknpweufuwl.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impic2Nvb2xvZGtrbnB3ZXVmdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODEzMDQsImV4cCI6MjA5MjQ1NzMwNH0.pvl9wv7dUMhwddgw5Sb8X-CGLsViMJICSNHxroGspTs'
  )

  try {
    const form = await req.formData()
    const file = form.get('file')
    const path = form.get('path')
    if (!file || !path) return Response.json({ error: 'missing file or path' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage
      .from('bcb - upload')
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage.from('bcb - upload').getPublicUrl(path)
    return Response.json({ success: true, url: data.publicUrl })
  } catch (e) {
    console.error('upload error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
