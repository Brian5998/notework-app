'use client'

import { useEffect, useState } from 'react'

export default function Navbar() {
  const [hasNotes, setHasNotes] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('notework_notes')
      if (stored) {
        const parsed = JSON.parse(stored)
        setHasNotes(Array.isArray(parsed) && parsed.length > 0)
      }
    } catch {}
  }, [])

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2.5rem',
        background: 'rgba(12, 12, 14, 0.72)',
        borderBottom: '1px solid var(--m-border)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <a
        href="#"
        style={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontSize: '26px',
          fontWeight: 400,
          color: 'var(--m-text)',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          display: 'inline-flex',
          alignItems: 'baseline',
          lineHeight: 1,
        }}
      >
        Note
        <span style={{ color: 'var(--m-accent)', fontStyle: 'italic' }}>work</span>
      </a>

      <div className="hidden sm:flex items-center" style={{ gap: '2.5rem' }}>
        {(['Features', 'Compare', 'Pricing'] as const).map((label) => (
          <a key={label} href={`#${label.toLowerCase()}`} className="nav-link">
            {label}
          </a>
        ))}
        {hasNotes ? (
          <a href="/app" className="btn-accent">
            Back to your notes
          </a>
        ) : (
          <a href="/app" className="btn-accent">
            Open app
          </a>
        )}
      </div>
    </nav>
  )
}
