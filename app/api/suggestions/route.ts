import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Note } from '@/lib/types'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { currentNote, otherNotes }: { currentNote: Note; otherNotes: Note[] } =
    await request.json()

  if (!currentNote || !otherNotes?.length) {
    return NextResponse.json({ suggestions: [] })
  }

  const otherNotesText = otherNotes
    .map((n) => `ID: ${n.id}\nTitle: ${n.title}\nContent: ${n.content}`)
    .join('\n\n---\n\n')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Given the current note below, identify which of the other notes share meaningful concepts, themes, or facts with it.

Current note:
Title: ${currentNote.title}
Content: ${currentNote.content}

Other notes:
${otherNotesText}

Return ONLY valid JSON in this exact format (no other text):
{"suggestions": [{"id": "...", "reason": "...", "confidence": 0.85}]}

Rules:
- confidence is a number 0.0–1.0 representing how strongly the notes are conceptually linked
- 0.9+ = directly related (same topic, shared facts); 0.6–0.9 = thematically related; below 0.6 = weak/incidental
- Return at most 3 suggestions. Only include notes with genuine thematic or conceptual overlap.
- If nothing is related, return {"suggestions": []}.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"suggestions":[]}')
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
