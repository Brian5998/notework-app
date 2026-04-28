import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { notes }: { notes: { id: string; title: string; content: string }[] } =
    await request.json()

  if (!notes?.length) return NextResponse.json({ clusters: [] })

  // Single note — no cluster needed
  if (notes.length === 1) {
    return NextResponse.json({
      clusters: [{ noteIds: [notes[0].id], label: notes[0].title || 'Note' }],
    })
  }

  const notesText = notes
    .map((n) => `ID: ${n.id}\nTitle: ${n.title}\nSummary: ${(n.content || '').slice(0, 180)}`)
    .join('\n\n---\n\n')

  // Target group size 2–4 notes
  const targetGroups = Math.max(1, Math.ceil(notes.length / 3))

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 384,
      messages: [
        {
          role: 'user',
          content: `You have ${notes.length} notes that are linked together. Partition them into ${targetGroups} semantically coherent group${targetGroups > 1 ? 's' : ''} of 2–4 notes each, based on shared concepts or themes. Give each group a concise, specific topic label (2–4 words, title case).

Notes:
${notesText}

Rules:
- Every note must appear in exactly one group.
- Groups of 1 note are only acceptable if there is truly no thematic overlap.
- Labels must be specific (e.g. "Gradient Descent Methods" not "Machine Learning").
- Return ONLY valid JSON, no other text:
{"clusters": [{"noteIds": ["id1", "id2"], "label": "Specific Topic Label"}, ...]}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"clusters":[]}')

    // Validate: every note ID must appear exactly once
    const seen = new Set<string>()
    const noteIds = new Set(notes.map((n) => n.id))
    const validClusters = (parsed.clusters ?? []).filter(
      (c: { noteIds: string[]; label: string }) =>
        Array.isArray(c.noteIds) && c.noteIds.length > 0 && typeof c.label === 'string'
    )
    validClusters.forEach((c: { noteIds: string[] }) =>
      c.noteIds.forEach((id: string) => seen.add(id))
    )

    // Add any notes that were missed by the AI into the last cluster
    const missed = notes.filter((n) => !seen.has(n.id)).map((n) => n.id)
    if (missed.length > 0 && validClusters.length > 0) {
      validClusters[validClusters.length - 1].noteIds.push(...missed)
    } else if (missed.length > 0) {
      validClusters.push({ noteIds: missed, label: 'Additional Notes' })
    }

    // Filter out note IDs that don't exist in this component
    const finalClusters = validClusters
      .map((c: { noteIds: string[]; label: string }) => ({
        ...c,
        noteIds: c.noteIds.filter((id: string) => noteIds.has(id)),
      }))
      .filter((c: { noteIds: string[] }) => c.noteIds.length > 0)

    return NextResponse.json({ clusters: finalClusters })
  } catch {
    // Fallback: one cluster per pair of notes
    const fallback = []
    for (let i = 0; i < notes.length; i += 3) {
      fallback.push({ noteIds: notes.slice(i, i + 3).map((n) => n.id), label: 'Related Notes' })
    }
    return NextResponse.json({ clusters: fallback })
  }
}
