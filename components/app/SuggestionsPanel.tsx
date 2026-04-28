'use client'

import { useState, useEffect, useRef } from 'react'
import { Note } from '@/lib/types'
import { useLinks } from '@/lib/LinksContext'
import { useToast } from './Toast'

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
  const { showToast } = useToast()

  function handleConfirm(targetId: string, reason: string, otherTitle: string) {
    confirmLink(currentNote.id, targetId, reason)
    showToast(`Linked to "${otherTitle}"`, {
      variant: 'success',
      action: { label: 'Undo', onClick: () => undoLastLink(targetId) },
    })
  }

  function undoLastLink(otherId: string) {
    const link = getLinksForNote(currentNote.id).find(
      (l) =>
        (l.sourceNoteId === currentNote.id && l.targetNoteId === otherId) ||
        (l.targetNoteId === currentNote.id && l.sourceNoteId === otherId),
    )
    if (link) removeLink(link.id)
  }

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
        width: 280,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Suggested section */}
      <div
        style={{
          padding: '1rem 1.1rem',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: 'var(--accent)', fill: 'none', strokeWidth: 2 }}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        Related
      </div>

      {isLoading && (
        <div style={{ padding: '0.75rem 1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: '0.85rem' }}>
              <div style={{ height: 12, width: `${50 + i * 15}%`, background: 'var(--border)', borderRadius: 4, marginBottom: 6, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 8, width: `${70 - i * 10}%`, background: 'var(--border)', borderRadius: 3, animation: 'skeletonPulse 1.5s ease-in-out 0.15s infinite' }} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && visibleSuggestions.length === 0 && confirmedLinks.length === 0 && (
        <div style={{ padding: '1.1rem', fontSize: '0.92rem', color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.55 }}>
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
              padding: '0.9rem 1.1rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
              <div
                onClick={() => onSelect(id)}
                style={{
                  flex: 1,
                  fontSize: '0.95rem',
                  fontWeight: 600,
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
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: badgeColor,
                  background: `${badgeColor}18`,
                  border: `1px solid ${badgeColor}40`,
                  borderRadius: 99,
                  padding: '0.15rem 0.45rem',
                  letterSpacing: '0.02em',
                }}>
                  {pct}%
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: '0.65rem' }}>
              {reason}
            </div>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                onClick={() =>
                  handleConfirm(id, reason, note.title || 'Untitled')
                }
                style={{
                  flex: 1,
                  background: 'var(--accent)',
                  color: '#0E0E0C',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.4rem 0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
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
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '0.4rem 0',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontWeight: 500,
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
              padding: '1rem 1.1rem 0.5rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              borderTop: visibleSuggestions.length > 0 ? '1px solid var(--border)' : undefined,
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
                  padding: '0.7rem 1.1rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  onClick={() => onSelect(otherId)}
                  style={{
                    flex: 1,
                    fontSize: '0.92rem',
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
                    fontSize: '1.1rem',
                    lineHeight: 1,
                    padding: '0 4px',
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
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              padding: '0.85rem 1.1rem 0.5rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
            }}
          >
            Connect
          </div>
          <div style={{ padding: '0 0.85rem 0.85rem' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '0.5rem 0.7rem',
                fontSize: '0.9rem',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          </div>
          {searchResults.map((note) => (
            <div
              key={note.id}
              style={{
                padding: '0.55rem 1.1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div
                onClick={() => onSelect(note.id)}
                style={{
                  flex: 1,
                  fontSize: '0.9rem',
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
                  handleConfirm(note.id, 'Manually connected', note.title || 'Untitled')
                  setSearchQuery('')
                }}
                title="Connect this note"
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#0E0E0C',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.25rem 0.6rem',
                  flexShrink: 0,
                  lineHeight: 1.2,
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
