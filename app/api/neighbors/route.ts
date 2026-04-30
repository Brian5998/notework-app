import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Note } from '@/lib/types'

const client = new Anthropic()

type NeighborRequest = {
  currentNote: Note
  otherNotes: Note[]
}

type Neighbor = {
  id: string
  reason: string
  kind: 'topical' | 'semantic'
}

type GapConcept = {
  concept: string
  rationale: string
}

type NeighborResponse = {
  topical: Neighbor[]
  semantic: Neighbor[]
  gap: GapConcept | null
}

export async function POST(request: NextRequest) {
  const { currentNote, otherNotes }: NeighborRequest = await request.json()

  if (!currentNote || !otherNotes || otherNotes.length === 0) {
    const empty: NeighborResponse = { topical: [], semantic: [], gap: null }
    return NextResponse.json(empty)
  }

  const candidates = otherNotes
    .map(
      (n) =>
        `ID: ${n.id}\nTitle: ${n.title}\nExcerpt: ${(n.content || '').slice(0, 280).replace(/\s+/g, ' ')}`,
    )
    .join('\n\n---\n\n')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 700,
      messages: [
        {
          role: 'user',
          content: `You are helping a student see the conceptual neighborhood around one of their notes — not just the keyword matches.

CURRENT NOTE:
Title: ${currentNote.title}
Content: ${currentNote.content.slice(0, 1200)}

CANDIDATE NEIGHBORS (other notes the student has written):
${candidates}

Return ONLY valid JSON in this exact shape:
{
  "topical": [{"id": "<note id>", "reason": "<why it's a topical neighbor — 1 short sentence>"}],
  "semantic": [{"id": "<note id>", "reason": "<why it's a semantic neighbor — concepts overlap WITHOUT keyword overlap>"}],
  "gap": {"concept": "<a single concept the student should consider but has no notes about>", "rationale": "<1 sentence on why it would bridge things they already know>"}
}

Rules:
- topical: up to 3 notes that share keywords / are obviously about the same area. Sort by closeness.
- semantic: up to 2 notes that DON'T share keywords with the current note but are conceptually adjacent (would be a 'huh, I'd never have searched for this' surprise). If none, return [].
- gap: exactly one concept (2-5 words) the student has NOT yet written about, that would connect the current note to other things they have written. If you can't find a clean one, set gap to null.
- Every id must come from the candidate list. Never invent ids.
- No commentary, no markdown, JSON only.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')

    const validIds = new Set(otherNotes.map((n) => n.id))
    const filterNeighbors = (
      arr: unknown,
      kind: 'topical' | 'semantic',
    ): Neighbor[] => {
      if (!Array.isArray(arr)) return []
      return arr
        .filter(
          (n): n is { id: string; reason: string } =>
            !!n &&
            typeof (n as { id: unknown }).id === 'string' &&
            typeof (n as { reason: unknown }).reason === 'string' &&
            validIds.has((n as { id: string }).id),
        )
        .map((n) => ({ id: n.id, reason: n.reason, kind }))
    }

    const topical = filterNeighbors(parsed.topical, 'topical').slice(0, 3)
    const semantic = filterNeighbors(parsed.semantic, 'semantic').slice(0, 2)
    const gap =
      parsed.gap &&
      typeof parsed.gap.concept === 'string' &&
      parsed.gap.concept.trim().length > 0
        ? {
            concept: parsed.gap.concept.trim(),
            rationale:
              typeof parsed.gap.rationale === 'string'
                ? parsed.gap.rationale.trim()
                : '',
          }
        : null

    const response: NeighborResponse = { topical, semantic, gap }
    return NextResponse.json(response)
  } catch {
    const empty: NeighborResponse = { topical: [], semantic: [], gap: null }
    return NextResponse.json(empty)
  }
}
