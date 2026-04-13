import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Note } from '@/lib/types'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { notes, count = 5 }: { notes: Note[]; count?: number } = await request.json()

  if (!notes?.length) {
    return NextResponse.json({ questions: [] })
  }

  const notesText = notes
    .map((n) => `Title: ${n.title}\nContent: ${n.content}`)
    .join('\n\n---\n\n')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a study assistant. Generate ${count} quiz questions based ONLY on the user's own notes below. Each question should test understanding, not just memorization. Mix question types: some multiple-choice, some true/false, some short-answer.

Notes:
${notesText}

Return ONLY valid JSON in this exact format (no other text):
{"questions": [
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A) ...",
    "explanation": "From your note on [title]: ...",
    "sourceNote": "title of the source note"
  },
  {
    "id": "q2",
    "type": "true_false",
    "question": "...",
    "correctAnswer": "True",
    "explanation": "...",
    "sourceNote": "..."
  },
  {
    "id": "q3",
    "type": "short_answer",
    "question": "...",
    "correctAnswer": "...",
    "explanation": "...",
    "sourceNote": "..."
  }
]}

Generate exactly ${count} questions. Make them genuinely test conceptual understanding of the material.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{"questions":[]}')
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ questions: [] })
  }
}
