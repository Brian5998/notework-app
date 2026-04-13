import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Note } from '@/lib/types'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { notes }: { notes: Note[] } = await request.json()

  if (!notes?.length || notes.length < 2) {
    return NextResponse.json({ concepts: [] })
  }

  const notesText = notes
    .map((n) => `Title: ${n.title}\nDate: ${n.createdAt}\nContent: ${n.content}`)
    .join('\n\n---\n\n')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analyze these personal notes chronologically and identify concepts that appear across multiple notes. Track how the user's understanding of each concept evolves or changes over time.

Notes (sorted by date):
${notesText}

Return ONLY valid JSON in this exact format (no other text):
{"concepts": [
  {
    "name": "concept name",
    "timeline": [
      {
        "noteTitle": "title of the note",
        "date": "ISO date string",
        "understanding": "brief description of what the user understood at this point",
        "change": "initial | deepened | revised | contradicted | refined"
      }
    ],
    "summary": "one sentence summary of how this concept evolved"
  }
]}

Include up to 5 of the most interesting evolving concepts. Only include concepts that appear in at least 2 notes.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"concepts":[]}')
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ concepts: [] })
  }
}
