import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

type Body = {
  topic: string
  notes: { id: string; title: string; content: string }[]
}

export async function POST(request: NextRequest) {
  const { topic, notes }: Body = await request.json()

  if (!notes || notes.length === 0) {
    return NextResponse.json({ markdown: '', citations: [] })
  }

  const notesText = notes
    .map(
      (n, i) =>
        `[${i + 1}] ${n.title}\n${(n.content || '').slice(0, 1500).replace(/\s+/g, ' ')}`,
    )
    .join('\n\n---\n\n')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1400,
      messages: [
        {
          role: 'user',
          content: `You are condensing a student's own notes into a single 1-page study sheet for the topic "${topic}". The output should be the kind of focused, exam-ready summary the student would write the night before a midterm.

The student's notes:
${notesText}

Return ONLY valid JSON in this exact shape:
{
  "headline": "<a 4-7 word title for the sheet>",
  "tldr": "<2-3 sentence executive summary, in the student's own voice>",
  "sections": [
    {"heading": "<2-4 word section title>", "bullets": ["<concise bullet point — preserve the student's phrasing where possible>", "..."]}
  ],
  "key_terms": [{"term": "<term>", "definition": "<1-sentence definition>"}],
  "open_questions": ["<a question the notes hint at but don't fully resolve>"]
}

Rules:
- 3-5 sections.
- Each section: 3-6 bullets, no longer.
- key_terms: 3-6 terms.
- open_questions: 1-3 questions, or [] if none.
- Use the student's own phrasing when possible — don't sound like a generic textbook. Preserve idiosyncratic notation, latex, abbreviations.
- No markdown headings. No commentary. JSON only.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')

    return NextResponse.json({
      headline: typeof parsed.headline === 'string' ? parsed.headline : topic,
      tldr: typeof parsed.tldr === 'string' ? parsed.tldr : '',
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      key_terms: Array.isArray(parsed.key_terms) ? parsed.key_terms : [],
      open_questions: Array.isArray(parsed.open_questions)
        ? parsed.open_questions
        : [],
      citations: notes.map((n, i) => ({
        index: i + 1,
        id: n.id,
        title: n.title,
      })),
    })
  } catch {
    return NextResponse.json({
      headline: topic,
      tldr: '',
      sections: [],
      key_terms: [],
      open_questions: [],
      citations: [],
    })
  }
}
