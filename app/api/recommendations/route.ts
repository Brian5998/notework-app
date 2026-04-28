import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

type ReqNote = { id: string; title: string; content: string; tags?: string[] }
type Recommendation = {
  topic: string
  why: string
  builds_on: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'next-step' | 'adjacent' | 'foundational'
}

export async function POST(request: NextRequest) {
  try {
    const {
      notes,
      workspaceType = 'student',
    }: { notes: ReqNote[]; workspaceType?: string } = await request.json()

    if (!notes || notes.length < 2) {
      return NextResponse.json({ recommendations: [] })
    }

    const notesText = notes
      .slice(0, 25)
      .map(
        (n) =>
          `- ${n.title}${n.tags?.length ? ` [${n.tags.join(', ')}]` : ''}: ${(n.content || '').slice(0, 120).replace(/\n/g, ' ')}`,
      )
      .join('\n')

    const audienceFrame =
      workspaceType === 'professional'
        ? 'a working professional who applies these concepts in client work'
        : workspaceType === 'researcher'
        ? 'a researcher building toward original contributions'
        : 'a student building a deep understanding of the material'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content: `You are a personalized learning guide for ${audienceFrame}.

Based on the user's existing notes below, recommend 5 specific next topics they should explore. Mix:
- 2 "next-step" topics that directly build on what they know (logical continuations)
- 2 "adjacent" topics in neighboring fields they're not yet exploring (concept drift / cross-pollination)
- 1 "foundational" topic that strengthens a prerequisite they may have skipped over

Be specific, not generic. Cite which notes the recommendation builds on by title.

Notes the user has:
${notesText}

Return ONLY valid JSON in this exact shape, no other text:
{"recommendations": [
  {"topic": "Specific topic name (3-6 words)", "why": "1-sentence reason connecting to their notes", "builds_on": ["Note Title 1", "Note Title 2"], "difficulty": "easy|medium|hard", "category": "next-step|adjacent|foundational"}
]}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"recommendations":[]}')
    const recs: Recommendation[] = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 6)
      : []

    return NextResponse.json({ recommendations: recs })
  } catch {
    return NextResponse.json({ recommendations: [] })
  }
}
