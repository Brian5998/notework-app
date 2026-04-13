'use client'

import { Note } from '@/lib/types'

type Result = { id: string; reason: string }

type Props = {
  results: Result[]
  notes: Note[]
  onSelect: (id: string) => void
}

export default function SearchResults({ results, notes, onSelect }: Props) {
  const noteMap = Object.fromEntries(notes.map((n) => [n.id, n]))

  if (results.length === 0) {
    return (
      <div style={{ padding: '1.5rem 1rem', fontSize: '0.82rem', color: 'var(--ink-faint)', textAlign: 'center' }}>
        No matching notes found.
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', color: 'var(--ink-faint)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>
      {results.map(({ id, reason }) => {
        const note = noteMap[id]
        if (!note) return null
        return (
          <div
            key={id}
            onClick={() => onSelect(id)}
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              borderLeft: '2px solid transparent',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--accent-light)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.25rem' }}>
              {note.title || 'Untitled'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              {reason}
            </div>
          </div>
        )
      })}
    </div>
  )
}
