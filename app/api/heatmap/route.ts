import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Note } from '@/lib/types'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { notes }: { notes: Note[] } = await request.json()

  if (!notes?.length) {
    return NextResponse.json({ topics: [] })
  }

  const notesText = notes
    .map((n) => `Title: ${n.title}\nContent: ${n.content}`)
    .join('\n\n---\n\n')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Extract the key concepts/topics from these notes and count how many notes each concept appears in. This will be used to generate a concept heatmap.

Notes:
${notesText}

Return ONLY valid JSON in this exact format (no other text):
{"topics": [
  {
    "name": "concept or topic name",
    "count": 3,
    "noteIds": ["note titles that mention this concept"]
  }
]}

Include up to 15 topics, sorted by count (highest first). Only include topics that are meaningful concepts, not generic words.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"topics":[]}')
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ topics: [] })
  }
}
