import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const TEXT_TYPES = [
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/octet-stream', // .md files often arrive as this
]

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const name = file.name
    const ext = name.split('.').pop()?.toLowerCase() ?? ''
    const title = name.replace(/\.[^.]+$/, '')

    // ── Plain text files (.txt, .md) — read directly, no parsing needed ──
    if (ext === 'txt' || ext === 'md' || TEXT_TYPES.includes(file.type)) {
      const content = await file.text()
      return NextResponse.json({ title, content: content.trim() })
    }

    // ── PDF — send to Claude as a native document, ask it to extract text ──
    if (ext === 'pdf' || file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document' as const,
                source: {
                  type: 'base64' as const,
                  media_type: 'application/pdf' as const,
                  data: base64,
                },
              },
              {
                type: 'text' as const,
                text: 'Extract all the text from this document exactly as written. Return only the extracted text — no commentary, no formatting, no markdown. Preserve paragraph breaks with blank lines.',
              },
            ],
          },
        ],
      })

      const content = (message.content[0] as { type: string; text: string }).text.trim()
      return NextResponse.json({ title, content })
    }

    return NextResponse.json(
      { error: `Unsupported file type: .${ext}. Please upload a PDF, .txt, or .md file.` },
      { status: 400 }
    )
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}
