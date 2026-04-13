import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getClient(tokens: object) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback'
  )
  oauth2Client.setCredentials(tokens)
  return oauth2Client
}

export async function POST(req: NextRequest) {
  const tokenCookie = req.cookies.get('gdrive_tokens')?.value
  if (!tokenCookie) return NextResponse.json({ error: 'not_connected' }, { status: 401 })

  const { fileId, fileName, mimeType } = await req.json()

  try {
    const tokens = JSON.parse(Buffer.from(tokenCookie, 'base64').toString())
    const auth = getClient(tokens)
    const drive = google.drive({ version: 'v3', auth })

    let content = ''

    if (mimeType === 'application/vnd.google-apps.document') {
      // Export Google Doc as plain text
      const exportRes = await drive.files.export(
        { fileId, mimeType: 'text/plain' },
        { responseType: 'text' }
      )
      content = exportRes.data as string
    } else {
      // Download PDF and send to Claude
      const fileRes = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      )
      const base64 = Buffer.from(fileRes.data as ArrayBuffer).toString('base64')

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as never,
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        }],
      })
      content = (message.content[0] as { type: string; text: string }).text.trim()
    }

    // Run content through Claude to format equations and structure
    const formatted = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `${FORMATTING_PROMPT}\n\n${content}`,
      }],
    })

    return NextResponse.json({
      title: fileName.replace(/\.[^.]+$/, ''),
      content: (formatted.content[0] as { type: string; text: string }).text.trim(),
    })
  } catch (err) {
    console.error('Drive import error:', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}

const EXTRACTION_PROMPT = `Extract all the text from this document exactly as written. Return only the extracted text — no commentary, no extra markdown. Preserve paragraph breaks with blank lines.`

const FORMATTING_PROMPT = `You are formatting academic notes. Convert the following text into clean, structured markdown notes.

Rules:
- Use **bold** for key terms and important concepts
- Use # for main section headers, ## for subsections
- Use - for bullet points, with two spaces for nested bullets
- Format ALL mathematical expressions as LaTeX:
  - Inline math (within a sentence): wrap in single dollar signs like $Q_D(p) = q_1(p) + q_2(p)$
  - Block/display math (standalone equations): wrap in double dollar signs like $$P = 10 - q$$
- Preserve the meaning and structure of the original text exactly
- Do not add commentary or explanations not in the original

Return only the formatted markdown text:`
