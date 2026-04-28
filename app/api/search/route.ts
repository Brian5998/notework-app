import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Note } from '@/lib/types'

const client = new Anthropic()

type VocabMapping = { query: string; noteId: string }

export async function POST(request: NextRequest) {
  const {
    query,
    notes,
    vocabMappings = [],
  }: { query: string; notes: Note[]; vocabMappings?: VocabMapping[] } =
    await request.json()

  if (!query || !notes?.length) {
    return NextResponse.json({ results: [], neighbors: [] })
  }

  const notesText = notes
    .map((n) => `ID: ${n.id}\nTitle: ${n.title}\nContent: ${n.content}`)
    .join('\n\n---\n\n')

  const vocabHint =
    vocabMappings.length > 0
      ? `\n\nThe user has previously confirmed these search→note mappings (use them to understand their vocabulary):\n${vocabMappings.map((v) => `- "${v.query}" → note ${v.noteId}`).join('\n')}\n`
      : ''

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a semantic search engine for personal notes. Given the notes below, return:
1. The most relevant notes for the search query, ranked by relevance. For each, include a brief reason AND an excerpt (a short phrase or sentence from the note that best matches the query).
2. Separately, 2-3 "neighboring" notes that don't directly match but are conceptually adjacent — things the user might also want to read.
${vocabHint}
Search query: "${query}"

Notes:
${notesText}

Return ONLY valid JSON in this exact format (no other text):
{
  "results": [{"id": "...", "reason": "...", "excerpt": "...short quote from the note..."}],
  "neighbors": [{"id": "...", "reason": "...why this is tangentially relevant..."}]
}

Include up to 5 main results and up to 3 neighbors. Only include genuinely relevant notes. Neighbors must NOT overlap with main results. If nothing matches, return {"results": [], "neighbors": []}.`,
        },
      ],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"results":[],"neighbors":[]}')
    return NextResponse.json({
      results: parsed.results ?? [],
      neighbors: parsed.neighbors ?? [],
    })
  } catch {
    return NextResponse.json({ results: [], neighbors: [] })
  }
}
