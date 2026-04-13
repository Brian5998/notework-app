import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email } = body

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // TODO: replace with real persistence (e.g. a database, Resend, etc.)
  console.log(`[waitlist] New signup: ${email}`)

  return NextResponse.json({ ok: true }, { status: 200 })
}
