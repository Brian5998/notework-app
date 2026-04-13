'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotes } from '@/lib/NotesContext'

export default function TimelinePage() {
  const router = useRouter()
  const { notes } = useNotes()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [notes]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, typeof sortedNotes>()
    for (const note of sortedNotes) {
      const d = new Date(note.createdAt)
      const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(note)
    }
    return [...map.entries()]
  }, [sortedNotes])

  function navigateToNote(id: string) {
    try { localStorage.setItem('notework_selected_note', id) } catch {}
    router.push('/app')
  }

  if (notes.length === 0) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--bg)',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          color: 'var(--ink-faint)',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, stroke: 'var(--ink-faint)', fill: 'none', strokeWidth: 1.2, opacity: 0.5 }}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <p style={{ fontSize: '0.95rem' }}>No notes yet. Create some notes to see your timeline.</p>
        <Link href="/app" style={{ color: 'var(--accent)', fontSize: '0.82rem', textDecoration: 'none' }}>
          ← Back to notes
        </Link>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1.25rem',
          borderBottom: '0.5px solid var(--border)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        <Link href="/app" style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textDecoration: 'none' }}>
          ← Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', fontSize: '0.95rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Note<span style={{ color: 'var(--accent)' }}>work</span>
          </span>
          <span style={{ color: 'var(--ink-faint)', fontSize: '0.75rem' }}>Timeline</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Timeline content */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
          }}
        >
          When your ideas were captured
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', marginBottom: '3rem' }}>
          A chronological view of every note, showing when and what you were thinking.
        </p>

        {grouped.map(([month, monthNotes]) => (
          <div key={month} style={{ marginBottom: '2.5rem' }}>
            {/* Month header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}>
              <span style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontSize: '1.1rem',
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
              }}>
                {month}
              </span>
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--accent)',
                background: 'var(--accent-light)',
                padding: '0.15rem 0.5rem',
                borderRadius: 100,
                fontWeight: 500,
              }}>
                {monthNotes.length}
              </span>
              <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
            </div>

            {/* Notes in this month */}
            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute',
                left: '5px',
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'var(--border-strong)',
              }} />

              {monthNotes.map((note) => {
                const d = new Date(note.createdAt)
                const day = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                const isHovered = hoveredId === note.id
                const preview = note.content.slice(0, 120).trim()

                return (
                  <div
                    key={note.id}
                    onClick={() => navigateToNote(note.id)}
                    onMouseEnter={() => setHoveredId(note.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      position: 'relative',
                      marginBottom: '1rem',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius)',
                      border: `0.5px solid ${isHovered ? 'var(--accent)' : 'var(--border)'}`,
                      background: isHovered ? 'var(--accent-light)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Dot on timeline */}
                    <div style={{
                      position: 'absolute',
                      left: '-1.5rem',
                      top: '1rem',
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: isHovered ? 'var(--accent)' : 'var(--bg-card)',
                      border: `2px solid ${isHovered ? 'var(--accent)' : 'var(--accent-mid)'}`,
                      transform: 'translateX(-3px)',
                      transition: 'all 0.15s',
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{
                        fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                        fontSize: '0.95rem',
                        color: 'var(--ink)',
                        letterSpacing: '-0.01em',
                      }}>
                        {note.title || 'Untitled'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                        {day} · {time}
                      </span>
                    </div>
                    {preview && (
                      <p style={{
                        fontSize: '0.78rem',
                        color: 'var(--ink-muted)',
                        lineHeight: 1.5,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {preview}{note.content.length > 120 ? '...' : ''}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
