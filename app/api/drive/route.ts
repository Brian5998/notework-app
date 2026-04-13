import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

function getClient(tokens: object) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback'
  )
  oauth2Client.setCredentials(tokens)
  return oauth2Client
}

export async function GET(req: NextRequest) {
  const tokenCookie = req.cookies.get('gdrive_tokens')?.value
  if (!tokenCookie) return NextResponse.json({ error: 'not_connected' }, { status: 401 })

  try {
    const tokens = JSON.parse(Buffer.from(tokenCookie, 'base64').toString())
    const auth = getClient(tokens)
    const drive = google.drive({ version: 'v3', auth })

    const res = await drive.files.list({
      q: "(mimeType='application/vnd.google-apps.document' or mimeType='application/pdf') and trashed=false",
      fields: 'files(id,name,mimeType,modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50,
    })

    return NextResponse.json({ files: res.data.files ?? [] })
  } catch {
    return NextResponse.json({ error: 'drive_error' }, { status: 500 })
  }
}
