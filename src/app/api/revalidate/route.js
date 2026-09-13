import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function GET() {
  revalidatePath('/staff2')
  return NextResponse.json({ revalidated: true })
}
