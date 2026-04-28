import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

type ClusterType =
  | 'stem'
  | 'humanities'
  | 'science'
  | 'finance'
  | 'language'
  | 'unassigned'

const VALID_TYPES: ClusterType[] = [
  'stem',
  'humanities',
  'science',
  'finance',
  'language',
  'unassigned',
]

export async function POST(request: NextRequest) {
  const {
    titles,
    contents,
    label,
    classify,
  }: {
    titles: string[]
    contents: string[]
    label?: string
    classify?: boolean
  } = await request.json()

  if (!titles?.length) {
    return NextResponse.json({ topic: '', type: 'unassigned' })
  }

  const notesText = titles
    .map((t, i) => `• ${t}\n  ${(contents[i] || '').slice(0, 220)}`)
    .join('\n\n')

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 180,
      messages: [
        {
          role: 'user',
          content: `You are classifying a cluster of a student's notes. Read the notes below and return a JSON object with two fields:

1. "topic" — a concise 2–4 word title-case label for what this cluster is about (e.g. "LP Duality", "Synaptic Plasticity", "Creative Destruction"). Be specific; avoid generic words like "Notes" or "Related".

2. "type" — EXACTLY one of these six category keys, based on the dominant academic subject of the notes:
   - "stem"        → math, statistics, optimization, algorithms, computer science, software, machine learning, engineering, physics of computation
   - "science"     → biology, chemistry, neuroscience, ecology, earth science, astronomy, physics (of the natural world), medicine
   - "finance"     → economics, finance, markets, portfolio theory, capitalism, business history, game theory applied to markets
   - "humanities"  → history, philosophy, sociology, literature, religion, writing, rhetoric, art history
   - "language"    → linguistics, phonology, syntax, specific languages, cultural/communicative studies
   - "unassigned"  → only if truly none of the above fit

Cluster label hint (may be wrong): ${label ?? '(none)'}

Notes:
${notesText}

Return ONLY valid JSON, no prose, no code fences:
{"topic": "...", "type": "..."}`,
        },
      ],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    let topic = ''
    let type: ClusterType = 'unassigned'

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (typeof parsed.topic === 'string') {
          topic = parsed.topic.trim().replace(/^["']|["']$/g, '')
        }
        if (
          typeof parsed.type === 'string' &&
          (VALID_TYPES as string[]).includes(parsed.type.toLowerCase())
        ) {
          type = parsed.type.toLowerCase() as ClusterType
        }
      } catch {
        // fallback — treat whole response as topic
        topic = text.trim().replace(/^["']|["']$/g, '').slice(0, 64)
      }
    } else {
      topic = text.trim().replace(/^["']|["']$/g, '').slice(0, 64)
    }

    // Ensure we always have *something* — if parsing failed, classify from
    // whatever we recovered plus the label hint.
    if (!topic && label) topic = label
    if (classify === false) {
      return NextResponse.json({ topic })
    }
    return NextResponse.json({ topic, type })
  } catch {
    return NextResponse.json({ topic: label ?? '', type: 'unassigned' })
  }
}
