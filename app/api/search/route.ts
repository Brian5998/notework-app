import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Note } from '@/lib/types'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { query, notes }: { query: string; notes: Note[] } = await request.json()

  if (!query || !notes?.length) {
    return NextResponse.json({ results: [] })
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
          content: `You are a semantic search engine for personal notes. Given the notes below, return the IDs of the most relevant ones for the search query, ranked by relevance. Include a brief reason for each match.

Search query: "${query}"

Notes:
${notesText}

Return ONLY valid JSON in this exact format (no other text):
{"results": [{"id": "...", "reason": "..."}]}

Include up to 5 results. Only include notes that are genuinely relevant. If nothing matches, return {"results": []}.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"results":[]}')
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ results: [] })
  }
}
