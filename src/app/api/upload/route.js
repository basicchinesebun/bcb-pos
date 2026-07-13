import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

export async function POST(req) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    const path = form.get('path')
    if (!file || !path) return Response.json({ error: 'missing file or path' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: path,
      Body: buffer,
      ContentType: file.type || 'image/jpeg',
    }))

    const url = `${process.env.R2_PUBLIC_URL}/${path}`
    return Response.json({ success: true, url })
  } catch (e) {
    console.error('upload error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
