import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Note } from '@/lib/types'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { notes }: { notes: Note[] } = await request.json()

  if (!notes || notes.length < 2) {
    return NextResponse.json({ contradictions: [] })
  }

  const notesText = notes
    .map((n) => `ID: ${n.id}\nTitle: ${n.title}\nContent: ${n.content}`)
    .join('\n\n---\n\n')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Review these notes for factual contradictions or inconsistencies — statements that directly conflict with each other. Do NOT flag stylistic differences or complementary information.

Notes:
${notesText}

Return ONLY valid JSON in this exact format (no other text):
{"contradictions": [{"noteIds": ["id1", "id2"], "explanation": "...", "quotes": ["exact quote from note 1 that conflicts", "exact quote from note 2 that conflicts"]}]}

Rules:
- quotes must be verbatim short excerpts (≤ 25 words each) from the note content
- one quote per noteId, in the same order as noteIds
- if you cannot find a verbatim quote, use an empty string for that entry

If there are no contradictions, return {"contradictions": []}.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"contradictions":[]}')
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ contradictions: [] })
  }
}
