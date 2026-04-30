'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotes } from '@/lib/NotesContext'
import { useLinks, makeContradictionKey } from '@/lib/LinksContext'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useToast } from '@/components/app/Toast'
import { Note, Contradiction } from '@/lib/types'

type Filter = 'all' | 'tag' | 'recent'

export default function ConflictsPage() {
  const router = useRouter()
  const { notes } = useNotes()
  const {
    detectedContradictions,
    updateDetectedContradictions,
    dismissContradiction,
    resolveContradiction,
    isContradictionDismissed,
  } = useLinks()
  const { userName } = useWorkspace()
  const { showToast } = useToast()

  const [filter, setFilter] = useState<Filter>('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSerializedRef = useRef<string>('')

  const noteMap = useMemo(
    () => Object.fromEntries(notes.map((n) => [n.id, n])),
    [notes],
  )

  // Auto-trigger contradiction scan if we don't have any yet
  useEffect(() => {
    if (notes.length < 2) return
    const sig = notes.map((n) => n.id + n.content.length).join('|')
    if (sig === lastSerializedRef.current) return
    lastSerializedRef.current = sig

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setScanning(true)
      setScanProgress('Scanning every note for inconsistencies…')
      try {
        const res = await fetch('/api/contradictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        })
        const data = await res.json()
        updateDetectedContradictions(data.contradictions ?? [])
      } finally {
        setScanning(false)
        setScanProgress('')
      }
    }, 1200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [notes, updateDetectedContradictions])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [notes])

  const visibleContradictions = useMemo(() => {
    return detectedContradictions.filter((c) => {
      const key = makeContradictionKey(c.noteIds, c.explanation)
      if (isContradictionDismissed(key)) return false
      if (filter === 'tag' && tagFilter) {
        const involvedTags = new Set(
          c.noteIds.flatMap((id) => noteMap[id]?.tags ?? []),
        )
        if (!involvedTags.has(tagFilter)) return false
      }
      return true
    })
  }, [
    detectedContradictions,
    filter,
    tagFilter,
    isContradictionDismissed,
    noteMap,
  ])

  const dismissedCount = useMemo(
    () =>
      detectedContradictions.filter((c) =>
        isContradictionDismissed(makeContradictionKey(c.noteIds, c.explanation)),
      ).length,
    [detectedContradictions, isContradictionDismissed],
  )

  async function runFreshSweep(scope?: { tag: string }) {
    const targetNotes = scope
      ? notes.filter((n) => (n.tags ?? []).includes(scope.tag))
      : notes
    if (targetNotes.length < 2) {
      showToast('Need at least 2 notes to scan.', { variant: 'warn' })
      return
    }
    setScanning(true)
    setScanProgress(
      scope
        ? `Pre-exam sweep — checking ${targetNotes.length} notes tagged "${scope.tag}"…`
        : `Scanning all ${targetNotes.length} notes for contradictions…`,
    )
    try {
      const res = await fetch('/api/contradictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: targetNotes }),
      })
      const data = await res.json()
      const fresh: Contradiction[] = data.contradictions ?? []
      // Merge: keep existing dismissed-aware entries that don't match this scope
      if (scope) {
        const targetIds = new Set(targetNotes.map((n) => n.id))
        const outOfScope = detectedContradictions.filter(
          (c) => !c.noteIds.every((id) => targetIds.has(id)),
        )
        updateDetectedContradictions([...outOfScope, ...fresh])
      } else {
        updateDetectedContradictions(fresh)
      }
      showToast(
        fresh.length === 0
          ? 'No contradictions found. Looking sharp.'
          : `Found ${fresh.length} contradiction${fresh.length === 1 ? '' : 's'}.`,
        { variant: fresh.length === 0 ? 'success' : 'warn' },
      )
    } catch {
      showToast('Scan failed. Try again.', { variant: 'warn' })
    } finally {
      setScanning(false)
      setScanProgress('')
    }
  }

  const greeting = userName ? `${userName}'s` : 'Your'

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        color: 'var(--ink)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '1rem 1.75rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Link
          href="/app"
          style={{
            color: 'var(--ink-muted)',
            fontSize: '1rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          ← Back to notes
        </Link>
        <span
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: '1.5rem',
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          Note
          <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>work</span>{' '}
          <span style={{ color: 'var(--ink-faint)', fontSize: '1.05rem' }}>· Conflicts</span>
        </span>
        <button
          onClick={() => runFreshSweep()}
          disabled={scanning || notes.length < 2}
          style={{
            background: scanning ? 'var(--bg-elevated-2)' : 'var(--accent)',
            color: scanning ? 'var(--ink-muted)' : '#0E0E0C',
            border: 'none',
            borderRadius: 99,
            padding: '0.6rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: scanning ? 'wait' : 'pointer',
            letterSpacing: '0.02em',
            boxShadow: scanning ? 'none' : '0 0 24px var(--accent-glow)',
          }}
        >
          {scanning ? 'Scanning…' : 'Re-scan all notes'}
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '3rem 2.5rem 5rem',
        }}
      >
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          {/* Hero */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
                marginBottom: '0.85rem',
              }}
            >
              The wedge
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
                fontWeight: 400,
                color: 'var(--ink)',
                letterSpacing: '-0.025em',
                lineHeight: 1.05,
                marginBottom: '1rem',
              }}
            >
              {greeting} contradictions,{' '}
              <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>
                in one place
              </span>
              .
            </h1>
            <p
              style={{
                fontSize: '1.2rem',
                color: 'var(--ink-muted)',
                lineHeight: 1.55,
                maxWidth: 640,
              }}
            >
              Every detected inconsistency across your knowledge base. No competitor
              shows you this.{' '}
              {visibleContradictions.length > 0 &&
                `${visibleContradictions.length} unresolved · ${dismissedCount} dismissed.`}
            </p>
          </div>

          {/* Pre-exam sweep — by tag */}
          {allTags.length > 0 && (
            <div
              style={{
                marginBottom: '2.25rem',
                padding: '1.4rem 1.5rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  marginBottom: '0.6rem',
                }}
              >
                Pre-exam sweep
              </div>
              <div
                style={{
                  fontSize: '1.05rem',
                  color: 'var(--ink)',
                  marginBottom: '1rem',
                  lineHeight: 1.5,
                }}
              >
                Run a focused contradiction check across one tag — perfect right
                before a midterm.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => runFreshSweep({ tag })}
                    disabled={scanning}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.95rem',
                      background: 'var(--bg-elevated-2)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 99,
                      color: 'var(--ink)',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      cursor: scanning ? 'wait' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (scanning) return
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                        'var(--accent)'
                      ;(e.currentTarget as HTMLButtonElement).style.color =
                        'var(--accent)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                        'var(--border-strong)'
                      ;(e.currentTarget as HTMLButtonElement).style.color =
                        'var(--ink)'
                    }}
                  >
                    Sweep <strong>#{tag}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          {detectedContradictions.length > 0 && allTags.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '0.92rem', color: 'var(--ink-faint)' }}>
                Filter:
              </span>
              <button
                onClick={() => {
                  setFilter('all')
                  setTagFilter(null)
                }}
                style={chipStyle(filter === 'all')}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setFilter('tag')
                    setTagFilter(t)
                  }}
                  style={chipStyle(filter === 'tag' && tagFilter === t)}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          {/* Status / progress */}
          {scanning && (
            <div
              style={{
                padding: '1rem 1.2rem',
                marginBottom: '1.25rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--accent-mid)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '2px solid var(--accent)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <span style={{ color: 'var(--ink)', fontSize: '0.98rem' }}>
                {scanProgress}
              </span>
            </div>
          )}

          {/* List */}
          {visibleContradictions.length === 0 && !scanning ? (
            <EmptyState noteCount={notes.length} hasAny={detectedContradictions.length > 0} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visibleContradictions.map((c) => (
                <ConflictRow
                  key={makeContradictionKey(c.noteIds, c.explanation)}
                  contradiction={c}
                  noteMap={noteMap}
                  onResolve={(key, latestNoteId) => {
                    resolveContradiction(key)
                    showToast('Marked as resolved.', { variant: 'success' })
                    if (latestNoteId) {
                      try {
                        localStorage.setItem(
                          'notework_selected_note',
                          latestNoteId,
                        )
                      } catch {}
                      router.push('/app')
                    }
                  }}
                  onDismiss={(key) => {
                    dismissContradiction(key)
                    showToast('Dismissed.', { variant: 'info' })
                  }}
                  onOpenNote={(id) => {
                    try {
                      localStorage.setItem('notework_selected_note', id)
                    } catch {}
                    router.push('/app')
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.4rem 0.85rem',
    background: active ? 'var(--accent-light)' : 'transparent',
    border: `1px solid ${active ? 'var(--accent-mid)' : 'var(--border)'}`,
    borderRadius: 99,
    color: active ? 'var(--accent)' : 'var(--ink-muted)',
    fontSize: '0.88rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

function ConflictRow({
  contradiction: c,
  noteMap,
  onResolve,
  onDismiss,
  onOpenNote,
}: {
  contradiction: Contradiction
  noteMap: Record<string, Note>
  onResolve: (key: string, latestNoteId?: string) => void
  onDismiss: (key: string) => void
  onOpenNote: (id: string) => void
}) {
  const key = makeContradictionKey(c.noteIds, c.explanation)
  const involvedNotes = c.noteIds
    .map((id) => noteMap[id])
    .filter(Boolean) as Note[]

  // Identify "newer" note for the resolve flow
  const newest =
    involvedNotes.length > 0
      ? involvedNotes.reduce((a, b) =>
          new Date(a.createdAt).getTime() > new Date(b.createdAt).getTime() ? a : b,
        )
      : null

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-strong)',
        borderRight: '1px solid var(--border-strong)',
        borderBottom: '1px solid var(--border-strong)',
        borderLeft: '4px solid #ef4444',
        borderRadius: 14,
        padding: '1.25rem 1.4rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '0.75rem',
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2.2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#ef4444',
          }}
        >
          Contradiction
        </span>
      </div>

      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--ink)',
          lineHeight: 1.55,
          margin: '0 0 1rem',
        }}
      >
        {c.explanation}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
        {involvedNotes.map((n, i) => {
          const quote = c.quotes?.[i]?.trim()
          return (
            <div
              key={n.id}
              style={{
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10,
                padding: '0.75rem 0.95rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.6rem',
                  marginBottom: quote ? '0.35rem' : 0,
                }}
              >
                <button
                  onClick={() => onOpenNote(n.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                    fontSize: '1.1rem',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {n.title || 'Untitled'}
                </button>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--ink-faint)',
                    flexShrink: 0,
                  }}
                >
                  {new Date(n.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {quote && (
                <div
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--ink-muted)',
                    fontStyle: 'italic',
                    lineHeight: 1.55,
                  }}
                >
                  &ldquo;{quote}&rdquo;
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onResolve(key, newest?.id)}
          style={{
            background: 'var(--accent)',
            color: '#0E0E0C',
            border: 'none',
            borderRadius: 8,
            padding: '0.55rem 1.1rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Resolve — edit newer note →
        </button>
        <button
          onClick={() => onDismiss(key)}
          style={{
            background: 'transparent',
            color: 'var(--ink-muted)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '0.55rem 1.1rem',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Not really a conflict
        </button>
      </div>
    </div>
  )
}

function EmptyState({
  noteCount,
  hasAny,
}: {
  noteCount: number
  hasAny: boolean
}) {
  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--accent-light)',
          margin: '0 auto 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--accent)" strokeWidth="2.2" fill="none">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontSize: '1.65rem',
          color: 'var(--ink)',
          margin: '0 0 0.5rem',
          fontWeight: 400,
        }}
      >
        {noteCount < 2
          ? 'Add at least 2 notes to start scanning'
          : hasAny
            ? 'All clear — every contradiction is resolved or dismissed'
            : 'No contradictions caught yet'}
      </h2>
      <p
        style={{
          color: 'var(--ink-muted)',
          fontSize: '1.05rem',
          lineHeight: 1.55,
          maxWidth: 460,
          margin: '0 auto',
        }}
      >
        {noteCount < 2
          ? 'Once you have a few notes about overlapping concepts, Notework will compare them.'
          : 'Re-scan whenever you add new notes — contradictions tend to creep in around exam time.'}
      </p>
      {noteCount < 2 && (
        <Link
          href="/app"
          style={{
            display: 'inline-block',
            marginTop: '1.4rem',
            background: 'var(--accent)',
            color: '#0E0E0C',
            padding: '0.7rem 1.5rem',
            borderRadius: 99,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}
        >
          Write your first note →
        </Link>
      )}
    </div>
  )
}
