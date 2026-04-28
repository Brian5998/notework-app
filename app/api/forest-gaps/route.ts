import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Note } from '@/lib/types'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const {
    notes,
    confirmedLinkPairs,
    workspaceType = 'student',
  }: {
    notes: Note[]
    confirmedLinkPairs: { from: string; to: string }[]
    workspaceType?: string
  } = await request.json()

  if (!notes?.length || notes.length < 3) {
    return NextResponse.json({ gaps: [] })
  }

  const notesText = notes
    .map((n) => `Title: ${n.title}\nContent: ${n.content.slice(0, 300)}`)
    .join('\n---\n')

  const linksText = confirmedLinkPairs
    .map((l) => `${l.from} ↔ ${l.to}`)
    .join('\n')

  const adviceFrame =
    workspaceType === 'professional'
      ? 'These topics lack supporting evidence in their notes — recommend they document connections.'
      : workspaceType === 'researcher'
        ? 'These topics appear across notes but lack confirmed literature connections.'
        : 'These concepts appear often but have no confirmed connections — worth studying.'

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Analyze these notes and their confirmed connections. Identify 2-3 concepts that appear frequently across multiple notes but have NO confirmed links between them. These are "knowledge gaps" — areas where the user has written about related things but hasn't connected them.

Notes:
${notesText}

Confirmed connections:
${linksText || 'None yet'}

Context: ${adviceFrame}

Return ONLY valid JSON:
{"gaps": [{"concept": "short concept name", "appears_in": ["note title 1", "note title 2"], "suggestion": "one sentence on why connecting these would help"}]}

Return 2-3 gaps maximum. If no clear gaps exist, return {"gaps": []}.`,
        },
      ],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"gaps":[]}')
    return NextResponse.json({ gaps: parsed.gaps ?? [] })
  } catch {
    return NextResponse.json({ gaps: [] })
  }
}
