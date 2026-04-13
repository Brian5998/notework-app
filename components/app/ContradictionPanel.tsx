'use client'

import { useState, useEffect, useRef } from 'react'
import { Note, Contradiction } from '@/lib/types'
import { useLinks, makeContradictionKey } from '@/lib/LinksContext'

type Props = {
  notes: Note[]
  onSelectNote: (id: string) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function ContradictionPanel({ notes, onSelectNote, isOpen: isOpenProp, onOpenChange }: Props) {
  const [isOpenLocal, setIsOpenLocal] = useState(false)
  const [showDismissed, setShowDismissed] = useState(false)
  const isOpen = isOpenProp ?? isOpenLocal
  const [isChecking, setIsChecking] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevNotesRef = useRef<string>('')

  const {
    detectedContradictions: contradictions,
    updateDetectedContradictions,
    dismissContradiction,
    restoreContradiction,
    isContradictionDismissed,
  } = useLinks()

  useEffect(() => {
    if (notes.length < 2) return

    const serialized = notes.map((n) => n.id + n.content).join('|')
    if (serialized === prevNotesRef.current) return
    prevNotesRef.current = serialized

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsChecking(true)
      try {
        const res = await fetch('/api/contradictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        })
        const data = await res.json()
        const result: Contradiction[] = data.contradictions ?? []
        updateDetectedContradictions(result)
      } finally {
        setIsChecking(false)
      }
    }, 2000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [notes])

  const noteMap = Object.fromEntries(notes.map((n) => [n.id, n]))

  const activeContradictions = contradictions.filter(
    (c) => !isContradictionDismissed(makeContradictionKey(c.noteIds, c.explanation))
  )
  const dismissedList = contradictions.filter(
    (c) => isContradictionDismissed(makeContradictionKey(c.noteIds, c.explanation))
  )

  const count = activeContradictions.length

  function toggle() {
    const next = !isOpen
    setIsOpenLocal(next)
    onOpenChange?.(next)
  }

  function close() {
    setIsOpenLocal(false)
    onOpenChange?.(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggle}
        title="Contradictions"
        style={{
          background: count > 0 ? 'var(--conflict)' : 'var(--bg-card)',
          border: `0.5px solid ${count > 0 ? 'var(--conflict)' : 'var(--border)'}`,
          borderRadius: 6,
          padding: '0.2rem 0.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.72rem',
          fontWeight: 500,
          color: count > 0 ? '#fff' : 'var(--ink-faint)',
          transition: 'all 0.2s',
        }}
      >
        {isChecking ? (
          <span style={{ fontSize: '0.65rem' }}>…</span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {count}
          </>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            width: 380,
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink)' }}>
              Contradictions {count > 0 && <span style={{ color: 'var(--conflict)' }}>({count})</span>}
            </span>
            <button
              onClick={close}
              style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1rem' }}
            >
              ×
            </button>
          </div>

          {/* Empty state */}
          {contradictions.length === 0 ? (
            <div style={{ padding: '1.25rem 1rem', fontSize: '0.82rem', color: 'var(--ink-faint)', textAlign: 'center' }}>
              {notes.length < 2 ? 'Add more notes to detect contradictions.' : 'No contradictions found.'}
            </div>
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {/* Active contradictions */}
              {activeContradictions.length === 0 && (
                <div style={{ padding: '1rem', fontSize: '0.82rem', color: 'var(--ink-faint)', textAlign: 'center' }}>
                  All contradictions dismissed.
                </div>
              )}
              {activeContradictions.map((c) => {
                const key = makeContradictionKey(c.noteIds, c.explanation)
                return (
                  <ContradictionCard
                    key={key}
                    contradiction={c}
                    noteMap={noteMap}
                    onSelectNote={(id) => { onSelectNote(id); close() }}
                    onDismiss={() => dismissContradiction(key)}
                  />
                )
              })}

              {/* Dismissed section */}
              {dismissedList.length > 0 && (
                <>
                  <button
                    onClick={() => setShowDismissed((p) => !p)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      borderTop: '0.5px solid var(--border)',
                      padding: '0.55rem 1rem',
                      fontSize: '0.7rem',
                      color: 'var(--ink-faint)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <svg viewBox="0 0 24 24" style={{ width: 9, height: 9, stroke: 'currentColor', fill: 'none', strokeWidth: 2.5, transform: showDismissed ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    {dismissedList.length} dismissed
                  </button>
                  {showDismissed && dismissedList.map((c) => {
                    const key = makeContradictionKey(c.noteIds, c.explanation)
                    return (
                      <ContradictionCard
                        key={key}
                        contradiction={c}
                        noteMap={noteMap}
                        onSelectNote={(id) => { onSelectNote(id); close() }}
                        onRestore={() => restoreContradiction(key)}
                        dismissed
                      />
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type CardProps = {
  contradiction: Contradiction
  noteMap: Record<string, Note>
  onSelectNote: (id: string) => void
  onDismiss?: () => void
  onRestore?: () => void
  dismissed?: boolean
}

function ContradictionCard({ contradiction: c, noteMap, onSelectNote, onDismiss, onRestore, dismissed }: CardProps) {
  return (
    <div
      style={{
        padding: '0.9rem 1rem',
        borderBottom: '0.5px solid var(--border)',
        opacity: dismissed ? 0.55 : 1,
      }}
    >
      {/* Note badges */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {c.noteIds.map((id) => (
          <button
            key={id}
            onClick={() => onSelectNote(id)}
            style={{
              background: dismissed ? 'var(--bg)' : 'rgba(226,75,74,0.1)',
              border: `0.5px solid ${dismissed ? 'var(--border)' : 'rgba(226,75,74,0.3)'}`,
              borderRadius: 4,
              padding: '0.15rem 0.5rem',
              fontSize: '0.72rem',
              color: dismissed ? 'var(--ink-muted)' : 'var(--conflict)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {noteMap[id]?.title || 'Untitled'}
          </button>
        ))}
      </div>

      {/* Explanation */}
      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.55, margin: '0 0 0.6rem' }}>
        {c.explanation}
      </p>

      {/* Quote evidence */}
      {c.quotes && c.quotes.some((q) => q.trim()) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.65rem' }}>
          {c.quotes.map((quote, i) => {
            if (!quote.trim()) return null
            const noteTitle = noteMap[c.noteIds[i]]?.title || 'Untitled'
            return (
              <div
                key={i}
                style={{
                  background: dismissed ? 'transparent' : 'rgba(226,75,74,0.05)',
                  border: `0.5px solid ${dismissed ? 'var(--border)' : 'rgba(226,75,74,0.2)'}`,
                  borderRadius: 5,
                  padding: '0.4rem 0.6rem',
                }}
              >
                <div style={{ fontSize: '0.64rem', color: 'var(--ink-faint)', marginBottom: '0.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {noteTitle}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  &ldquo;{quote}&rdquo;
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {dismissed ? (
          <button
            onClick={onRestore}
            style={{
              background: 'none',
              border: '0.5px solid var(--border)',
              borderRadius: 4,
              padding: '0.18rem 0.55rem',
              fontSize: '0.68rem',
              color: 'var(--ink-faint)',
              cursor: 'pointer',
            }}
          >
            Restore
          </button>
        ) : (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: '0.5px solid var(--border)',
              borderRadius: 4,
              padding: '0.18rem 0.55rem',
              fontSize: '0.68rem',
              color: 'var(--ink-faint)',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
