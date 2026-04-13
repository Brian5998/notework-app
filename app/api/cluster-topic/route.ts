import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { titles, contents }: { titles: string[]; contents: string[] } = await request.json()

  if (!titles?.length) {
    return NextResponse.json({ topic: '' })
  }

  const notesText = titles
    .map((t, i) => `- ${t}: ${(contents[i] || '').slice(0, 120)}`)
    .join('\n')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: `These notes form a connected cluster. Give them a concise generalized topic label (2–4 words, title case, no quotes):

${notesText}

Return ONLY the topic label, nothing else.`,
        },
      ],
    })

    const topic = message.content[0].type === 'text'
      ? message.content[0].text.trim().replace(/^["']|["']$/g, '')
      : ''
    return NextResponse.json({ topic })
  } catch {
    return NextResponse.json({ topic: '' })
  }
}
