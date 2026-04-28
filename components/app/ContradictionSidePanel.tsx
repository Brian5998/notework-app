'use client'

import { Note, Contradiction } from '@/lib/types'
import { useLinks, makeContradictionKey } from '@/lib/LinksContext'

type Props = {
  note: Note
  contradictions: Contradiction[]
  allNotes: Note[]
  onClose: () => void
  onSelectNote: (id: string) => void
}

export default function ContradictionSidePanel({
  note,
  contradictions,
  allNotes,
  onClose,
  onSelectNote,
}: Props) {
  const { dismissContradiction, resolveContradiction } = useLinks()
  const noteMap = Object.fromEntries(allNotes.map((n) => [n.id, n]))

  if (contradictions.length === 0) return null

  return (
    <div
      style={{
        width: 380,
        flexShrink: 0,
        borderLeft: '0.5px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'sidePanelIn 0.2s ease-out',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg
            viewBox="0 0 24 24"
            style={{
              width: 14,
              height: 14,
              stroke: '#F59E0B',
              fill: 'none',
              strokeWidth: 2,
            }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'var(--ink)',
            }}
          >
            {contradictions.length} conflict
            {contradictions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-faint)',
            cursor: 'pointer',
            fontSize: '1.1rem',
          }}
        >
          ×
        </button>
      </div>

      {/* Contradiction cards */}
      {contradictions.map((c) => {
        const key = makeContradictionKey(c.noteIds, c.explanation)
        const otherIds = c.noteIds.filter((id) => id !== note.id)

        return (
          <div
            key={key}
            style={{
              padding: '1rem',
              borderBottom: '0.5px solid var(--border)',
            }}
          >
            {/* Explanation */}
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--ink)',
                lineHeight: 1.6,
                margin: '0 0 0.75rem',
              }}
            >
              {c.explanation}
            </p>

            {/* Side-by-side quotes */}
            {c.quotes && c.quotes.length >= 2 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                {c.noteIds.map((id, i) => {
                  const n = noteMap[id]
                  const quote = c.quotes?.[i]
                  if (!n || !quote?.trim()) return null
                  const isCurrent = id === note.id
                  return (
                    <div
                      key={id}
                      style={{
                        background: isCurrent
                          ? 'rgba(245,158,11,0.06)'
                          : 'rgba(226,75,74,0.06)',
                        border: `0.5px solid ${isCurrent ? 'rgba(245,158,11,0.2)' : 'rgba(226,75,74,0.2)'}`,
                        borderRadius: 8,
                        padding: '0.6rem',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--ink-faint)',
                          marginBottom: '0.3rem',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          fontWeight: 500,
                        }}
                      >
                        {isCurrent ? 'This note' : n.title || 'Untitled'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: isCurrent ? '#B45309' : 'var(--conflict)',
                          fontStyle: 'italic',
                          lineHeight: 1.55,
                        }}
                      >
                        &ldquo;{quote}&rdquo;
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Conflicting note links */}
            {otherIds.map((id) => {
              const other = noteMap[id]
              if (!other) return null
              return (
                <button
                  key={id}
                  onClick={() => onSelectNote(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    width: '100%',
                    padding: '0.4rem 0.55rem',
                    marginBottom: '0.4rem',
                    background: 'rgba(226,75,74,0.06)',
                    border: '0.5px solid rgba(226,75,74,0.15)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    color: 'var(--ink-muted)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ flex: 1 }}>{other.title || 'Untitled'}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--ink-faint)',
                    }}
                  >
                    View →
                  </span>
                </button>
              )
            })}

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              <button
                onClick={() => resolveContradiction(key)}
                style={{
                  flex: 1,
                  padding: '0.35rem 0',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                I&apos;ve updated this
              </button>
              <button
                onClick={() => dismissContradiction(key)}
                style={{
                  flex: 1,
                  padding: '0.35rem 0',
                  background: 'transparent',
                  color: 'var(--ink-faint)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
