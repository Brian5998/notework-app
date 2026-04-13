'use client'

import { useState, useEffect, useRef } from 'react'
import { Note } from '@/lib/types'
import { useLinks } from '@/lib/LinksContext'

type Suggestion = { id: string; reason: string; confidence?: number }

type Props = {
  currentNote: Note
  otherNotes: Note[]
  onSelect: (id: string) => void
}

const AUTO_CONFIRM_THRESHOLD = 0.75

export default function SuggestionsPanel({ currentNote, otherNotes, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevRef = useRef('')
  const { confirmLink, dismissSuggestion, isDismissed, isConfirmed, getLinksForNote, removeLink } = useLinks()

  useEffect(() => {
    if (otherNotes.length === 0) {
      setSuggestions([])
      return
    }

    const key = currentNote.id + currentNote.content
    if (key === prevRef.current) return
    prevRef.current = key

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentNote, otherNotes }),
        })
        const data = await res.json()
        const fetched: Suggestion[] = data.suggestions ?? []

        // Auto-confirm suggestions above threshold
        for (const s of fetched) {
          if ((s.confidence ?? 0) >= AUTO_CONFIRM_THRESHOLD && !isConfirmed(currentNote.id, s.id)) {
            confirmLink(currentNote.id, s.id, s.reason)
          }
        }

        setSuggestions(fetched)
      } finally {
        setIsLoading(false)
      }
    }, 1200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [currentNote.id, currentNote.content, otherNotes.length])

  const noteMap = Object.fromEntries(otherNotes.map((n) => [n.id, n]))
  const confirmedLinks = getLinksForNote(currentNote.id)

  // Show only below-threshold suggestions that aren't already confirmed/dismissed
  const visibleSuggestions = suggestions.filter(
    (s) =>
      !isDismissed(currentNote.id, s.id) &&
      !isConfirmed(currentNote.id, s.id) &&
      (s.confidence ?? 1) < AUTO_CONFIRM_THRESHOLD
  )

  // Manual search: filter other notes by query, exclude already confirmed
  const confirmedIds = new Set(
    confirmedLinks.map((l) =>
      l.sourceNoteId === currentNote.id ? l.targetNoteId : l.sourceNoteId
    )
  )
  const searchResults = searchQuery.trim().length > 0
    ? otherNotes.filter((n) => {
        if (n.id === currentNote.id || confirmedIds.has(n.id)) return false
        const q = searchQuery.toLowerCase()
        return (
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q)
        )
      }).slice(0, 6)
    : []

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        borderLeft: '0.5px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Suggested section */}
      <div
        style={{
          padding: '0.9rem 1rem',
          borderBottom: '0.5px solid var(--border)',
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, stroke: 'var(--accent)', fill: 'none', strokeWidth: 2 }}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        Related
      </div>

      {isLoading && (
        <div style={{ padding: '1rem', fontSize: '0.78rem', color: 'var(--ink-faint)', textAlign: 'center' }}>
          Finding connections…
        </div>
      )}

      {!isLoading && visibleSuggestions.length === 0 && confirmedLinks.length === 0 && (
        <div style={{ padding: '1rem', fontSize: '0.78rem', color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.6 }}>
          {otherNotes.length === 0
            ? 'Add more notes to see connections.'
            : 'No new suggestions.'}
        </div>
      )}

      {!isLoading && visibleSuggestions.map(({ id, reason, confidence }) => {
        const note = noteMap[id]
        if (!note) return null
        const pct = confidence != null ? Math.round(confidence * 100) : null
        const badgeColor = pct == null ? 'var(--ink-faint)'
          : pct >= 70 ? 'var(--accent)'
          : pct >= 50 ? '#D97706'
          : '#9CA3AF'
        return (
          <div
            key={id}
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '0.5px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <div
                onClick={() => onSelect(id)}
                style={{
                  flex: 1,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={note.title || 'Untitled'}
              >
                {note.title || 'Untitled'}
              </div>
              {pct != null && (
                <span style={{
                  flexShrink: 0,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: badgeColor,
                  background: `${badgeColor}18`,
                  border: `0.5px solid ${badgeColor}40`,
                  borderRadius: 99,
                  padding: '0.1rem 0.35rem',
                  letterSpacing: '0.02em',
                }}>
                  {pct}%
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              {reason}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => confirmLink(currentNote.id, id, reason)}
                style={{
                  flex: 1,
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '0.25rem 0',
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => dismissSuggestion(currentNote.id, id)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: 'var(--ink-faint)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 4,
                  padding: '0.25rem 0',
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )
      })}

      {/* Confirmed connections section */}
      {confirmedLinks.length > 0 && (
        <>
          <div
            style={{
              padding: '0.9rem 1rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              borderTop: visibleSuggestions.length > 0 ? '0.5px solid var(--border)' : undefined,
            }}
          >
            Confirmed
          </div>
          {confirmedLinks.map((link) => {
            const otherId = link.sourceNoteId === currentNote.id ? link.targetNoteId : link.sourceNoteId
            const other = noteMap[otherId]
            if (!other) return null
            return (
              <div
                key={link.id}
                style={{
                  padding: '0.6rem 1rem',
                  borderBottom: '0.5px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <div
                  onClick={() => onSelect(otherId)}
                  style={{
                    flex: 1,
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {other.title || 'Untitled'}
                </div>
                <button
                  onClick={() => removeLink(link.id)}
                  title="Remove connection"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-faint)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    padding: '0 2px',
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </>
      )}

      {/* Manual connect section */}
      {otherNotes.length > 0 && (
        <div style={{ marginTop: 'auto', borderTop: '0.5px solid var(--border)' }}>
          <div
            style={{
              padding: '0.75rem 1rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
            }}
          >
            Connect
          </div>
          <div style={{ padding: '0 0.75rem 0.75rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--bg)',
                border: '0.5px solid var(--border)',
                borderRadius: 6,
                padding: '0.3rem 0.5rem',
                fontSize: '0.75rem',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          </div>
          {searchResults.map((note) => (
            <div
              key={note.id}
              style={{
                padding: '0.45rem 1rem',
                borderTop: '0.5px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <div
                onClick={() => onSelect(note.id)}
                style={{
                  flex: 1,
                  fontSize: '0.76rem',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={note.title || 'Untitled'}
              >
                {note.title || 'Untitled'}
              </div>
              <button
                onClick={() => {
                  confirmLink(currentNote.id, note.id, 'Manually connected')
                  setSearchQuery('')
                }}
                title="Connect this note"
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.15rem 0.45rem',
                  flexShrink: 0,
                  lineHeight: 1.4,
                }}
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
