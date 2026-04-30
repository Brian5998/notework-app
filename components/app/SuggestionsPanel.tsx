'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Note } from '@/lib/types'
import { useLinks } from '@/lib/LinksContext'
import { useNotes } from '@/lib/NotesContext'
import { useToast } from './Toast'

type Suggestion = { id: string; reason: string; confidence?: number }

type Neighbor = {
  id: string
  reason: string
  kind: 'topical' | 'semantic'
}

type GapConcept = {
  concept: string
  rationale: string
}

type NeighborData = {
  topical: Neighbor[]
  semantic: Neighbor[]
  gap: GapConcept | null
}

type Tab = 'related' | 'neighbors'

type Props = {
  currentNote: Note
  otherNotes: Note[]
  onSelect: (id: string) => void
}

const AUTO_CONFIRM_THRESHOLD = 0.75

export default function SuggestionsPanel({ currentNote, otherNotes, onSelect }: Props) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [neighbors, setNeighbors] = useState<NeighborData>({
    topical: [],
    semantic: [],
    gap: null,
  })
  const [neighborsLoading, setNeighborsLoading] = useState(false)
  const [neighborsLoaded, setNeighborsLoaded] = useState(false)
  const [tab, setTab] = useState<Tab>('related')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const neighborDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevRef = useRef('')
  const prevNeighborRef = useRef('')
  const { confirmLink, dismissSuggestion, isDismissed, isConfirmed, getLinksForNote, removeLink } = useLinks()
  const { addNote } = useNotes()
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

  // Fetch neighbors lazily — only when the user opens the tab once
  useEffect(() => {
    if (tab !== 'neighbors') return
    if (otherNotes.length === 0) return
    const key = currentNote.id + currentNote.content.slice(0, 200)
    if (key === prevNeighborRef.current && neighborsLoaded) return
    prevNeighborRef.current = key

    if (neighborDebounceRef.current) clearTimeout(neighborDebounceRef.current)
    neighborDebounceRef.current = setTimeout(async () => {
      setNeighborsLoading(true)
      try {
        const res = await fetch('/api/neighbors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentNote, otherNotes }),
        })
        const data = (await res.json()) as NeighborData
        setNeighbors({
          topical: data.topical ?? [],
          semantic: data.semantic ?? [],
          gap: data.gap ?? null,
        })
        setNeighborsLoaded(true)
      } finally {
        setNeighborsLoading(false)
      }
    }, 400)

    return () => {
      if (neighborDebounceRef.current) clearTimeout(neighborDebounceRef.current)
    }
  }, [tab, currentNote.id, currentNote.content, otherNotes.length, neighborsLoaded])

  // Reset neighbor cache when the active note changes
  useEffect(() => {
    setNeighborsLoaded(false)
    setNeighbors({ topical: [], semantic: [], gap: null })
  }, [currentNote.id])

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

  function handleCreateGap(concept: string, rationale: string) {
    const note = addNote(
      concept,
      `# ${concept}\n\n${rationale ? `_${rationale}_\n\n` : ''}(suggested by Notework — concept that would bridge what you already know)\n`,
    )
    confirmLink(currentNote.id, note.id, `Bridges to "${concept}" gap concept`)
    showToast(`Drafted "${concept}" — opening it now`, { variant: 'success' })
    setTimeout(() => {
      try {
        localStorage.setItem('notework_selected_note', note.id)
      } catch {}
      router.push('/app')
      onSelect(note.id)
    }, 100)
  }

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <TabButton active={tab === 'related'} onClick={() => setTab('related')}>
          Related
        </TabButton>
        <TabButton active={tab === 'neighbors'} onClick={() => setTab('neighbors')}>
          Neighbors
        </TabButton>
      </div>

      {tab === 'neighbors' && (
        <NeighborsTab
          loading={neighborsLoading}
          loaded={neighborsLoaded}
          neighbors={neighbors}
          noteMap={noteMap}
          onSelect={onSelect}
          onCreateGap={handleCreateGap}
        />
      )}

      {tab === 'related' && isLoading && (
        <div style={{ padding: '0.75rem 1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: '0.85rem' }}>
              <div style={{ height: 12, width: `${50 + i * 15}%`, background: 'var(--border)', borderRadius: 4, marginBottom: 6, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 8, width: `${70 - i * 10}%`, background: 'var(--border)', borderRadius: 3, animation: 'skeletonPulse 1.5s ease-in-out 0.15s infinite' }} />
            </div>
          ))}
        </div>
      )}

      {tab === 'related' && !isLoading && visibleSuggestions.length === 0 && confirmedLinks.length === 0 && (
        <div style={{ padding: '1.25rem 1.1rem', fontSize: '0.95rem', color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.55 }}>
          {otherNotes.length === 0
            ? 'Add another note to start seeing connections.'
            : 'No new suggestions yet — keep writing and Notework will surface links.'}
        </div>
      )}

      {tab === 'related' && !isLoading && visibleSuggestions.map(({ id, reason, confidence }) => {
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
      {tab === 'related' && confirmedLinks.length > 0 && (
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
      {tab === 'related' && otherNotes.length > 0 && (
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        padding: '0.85rem 0',
        fontSize: '0.9rem',
        fontWeight: active ? 700 : 500,
        letterSpacing: '0.04em',
        color: active ? 'var(--ink)' : 'var(--ink-faint)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

function NeighborsTab({
  loading,
  loaded,
  neighbors,
  noteMap,
  onSelect,
  onCreateGap,
}: {
  loading: boolean
  loaded: boolean
  neighbors: { topical: Neighbor[]; semantic: Neighbor[]; gap: GapConcept | null }
  noteMap: Record<string, Note>
  onSelect: (id: string) => void
  onCreateGap: (concept: string, rationale: string) => void
}) {
  const empty =
    loaded &&
    neighbors.topical.length === 0 &&
    neighbors.semantic.length === 0 &&
    !neighbors.gap

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {loading && (
        <div style={{ padding: '0.95rem 1.1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: '1rem' }}>
              <div
                style={{
                  height: 12,
                  width: `${60 + i * 10}%`,
                  background: 'var(--border)',
                  borderRadius: 4,
                  marginBottom: 6,
                  animation: 'skeletonPulse 1.5s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  height: 8,
                  width: `${75 - i * 8}%`,
                  background: 'var(--border)',
                  borderRadius: 3,
                  animation:
                    'skeletonPulse 1.5s ease-in-out 0.15s infinite',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && empty && (
        <div
          style={{
            padding: '1.25rem 1.1rem',
            fontSize: '0.95rem',
            color: 'var(--ink-faint)',
            textAlign: 'center',
            lineHeight: 1.55,
          }}
        >
          Not enough notes for a neighborhood yet — write a few more and the
          surrounding ideas will surface here.
        </div>
      )}

      {!loading && neighbors.topical.length > 0 && (
        <NeighborSection
          title="Closest by topic"
          icon={
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="var(--accent)" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="9" opacity="0.4" />
            </svg>
          }
          neighbors={neighbors.topical}
          noteMap={noteMap}
          onSelect={onSelect}
        />
      )}

      {!loading && neighbors.semantic.length > 0 && (
        <NeighborSection
          title="You wouldn't have searched for this"
          icon={
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="#fbbf24" strokeWidth="2" fill="none">
              <polygon points="12 2 15 9 22 9.3 16.5 14 18 22 12 18 6 22 7.5 14 2 9.3 9 9" />
            </svg>
          }
          accent="#fbbf24"
          neighbors={neighbors.semantic}
          noteMap={noteMap}
          onSelect={onSelect}
        />
      )}

      {!loading && neighbors.gap && (
        <div
          style={{
            margin: '0.85rem 1rem',
            padding: '1rem 1.1rem',
            borderTop: '1px solid var(--border)',
            borderRight: '1px solid rgba(126,232,162,0.3)',
            borderBottom: '1px solid rgba(126,232,162,0.3)',
            borderLeft: '3px solid var(--accent)',
            background: 'var(--accent-light)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: '0.45rem',
            }}
          >
            ⊕ Bridge concept
          </div>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: '0.4rem',
              letterSpacing: '-0.01em',
            }}
          >
            {neighbors.gap.concept}
          </div>
          {neighbors.gap.rationale && (
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--ink-muted)',
                lineHeight: 1.55,
                margin: '0 0 0.75rem',
              }}
            >
              {neighbors.gap.rationale}
            </p>
          )}
          <button
            onClick={() =>
              onCreateGap(
                neighbors.gap!.concept,
                neighbors.gap!.rationale,
              )
            }
            style={{
              background: 'var(--accent)',
              color: '#0E0E0C',
              border: 'none',
              borderRadius: 8,
              padding: '0.45rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Draft a note on this →
          </button>
        </div>
      )}

      {!loading && loaded && (
        <div
          style={{
            marginTop: 'auto',
            padding: '0.85rem 1.1rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.78rem',
            color: 'var(--ink-faint)',
            lineHeight: 1.5,
          }}
        >
          Neighbors are computed from your own notes — not the public internet.
        </div>
      )}
    </div>
  )
}

function NeighborSection({
  title,
  icon,
  accent,
  neighbors,
  noteMap,
  onSelect,
}: {
  title: string
  icon: React.ReactNode
  accent?: string
  neighbors: Neighbor[]
  noteMap: Record<string, Note>
  onSelect: (id: string) => void
}) {
  return (
    <div>
      <div
        style={{
          padding: '0.95rem 1.1rem 0.5rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: accent ?? 'var(--ink-faint)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {icon}
        {title}
      </div>
      {neighbors.map((n) => {
        const note = noteMap[n.id]
        if (!note) return null
        return (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid var(--border)',
              padding: '0.85rem 1.1rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                'var(--bg-elevated)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                'transparent')
            }
          >
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '0.25rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {note.title || 'Untitled'}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--ink-muted)',
                lineHeight: 1.5,
              }}
            >
              {n.reason}
            </div>
          </button>
        )
      })}
    </div>
  )
}
