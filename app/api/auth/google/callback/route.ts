import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/app?drive_error=1', req.url))

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback'
  )

  const { tokens } = await oauth2Client.getToken(code)
  // Store tokens in a secure httpOnly cookie (base64 encoded)
  const tokenStr = Buffer.from(JSON.stringify(tokens)).toString('base64')

  const res = NextResponse.redirect(new URL('/app?drive_connected=1', req.url))
  res.cookies.set('gdrive_tokens', tokenStr, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return res
}
