import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const TEXT_TYPES = [
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/octet-stream', // .md files often arrive as this
]

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const IMAGE_MEDIA_TYPES: Record<string, 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const mode = formData.get('mode') as string | null

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

    // ── Images — use Claude vision to read handwritten or printed notes ──
    if (IMAGE_EXTENSIONS.includes(ext) || file.type.startsWith('image/')) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const mediaType = IMAGE_MEDIA_TYPES[ext] || 'image/jpeg'

      const isHandwriting = mode === 'handwriting'

      const prompt = isHandwriting
        ? `This is a photo of handwritten notes. Please:

1. Read and transcribe ALL the handwritten text in this image as accurately as possible.
2. Preserve the original structure: headings, bullet points, numbered lists, diagrams described in brackets, underlined text marked with emphasis.
3. If there are arrows, diagrams, or visual connections, describe them briefly in [brackets].
4. If any words are unclear, provide your best guess followed by [?].
5. Separate distinct sections with blank lines.

Return ONLY the transcribed text — no commentary, no preamble. Start directly with the content.`
        : `Extract all the text from this image exactly as written. Preserve the structure and formatting (headings, lists, etc.). If there are diagrams or figures, describe them briefly in [brackets]. Return only the extracted text — no commentary.`

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: 'text' as const,
                text: prompt,
              },
            ],
          },
        ],
      })

      const content = (message.content[0] as { type: string; text: string }).text.trim()
      const generatedTitle = isHandwriting
        ? `${title} (handwritten)`
        : title
      return NextResponse.json({ title: generatedTitle, content })
    }

    return NextResponse.json(
      { error: `Unsupported file type: .${ext}. Please upload a PDF, image, .txt, or .md file.` },
      { status: 400 }
    )
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}
