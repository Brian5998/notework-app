'use client'

import { useState } from 'react'

export default function WaitlistSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle')

  async function handleSubmit() {
    if (!email || !email.includes('@')) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 1500)
      return
    }
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // fire-and-forget; show success regardless for now
    }
    setStatus('success')
  }

  return (
    <div
      id="waitlist"
      style={{
        background: 'var(--ink)',
        color: 'var(--bg)',
        padding: '7rem 2.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <div
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(240,238,232,0.4)',
            marginBottom: '1rem',
          }}
        >
          Join the waitlist
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: 'var(--bg)',
            marginBottom: '1rem',
          }}
        >
          Be the first to know
          <br />
          when Notework launches.
        </h2>
        <p style={{ color: 'rgba(240,238,232,0.6)', marginBottom: '2.5rem', fontSize: '1rem' }}>
          Early access for waitlist members. Priority pricing locked in at signup. No spam — one email when we&apos;re ready.
        </p>

        {status === 'success' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              fontSize: '0.95rem',
              color: '#5CB87A',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5CB87A" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            You&apos;re on the list. We&apos;ll be in touch.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              maxWidth: 420,
              margin: '0 auto',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '0.85rem 1.25rem',
                borderRadius: '100px',
                border: `0.5px solid ${status === 'error' ? 'rgba(226,75,74,0.6)' : 'rgba(240,238,232,0.2)'}`,
                background: 'rgba(240,238,232,0.07)',
                color: 'var(--bg)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <button
              onClick={handleSubmit}
              style={{
                background: 'var(--bg)',
                color: 'var(--ink)',
                padding: '0.85rem 1.5rem',
                borderRadius: '100px',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '0.85')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '1')}
            >
              Get early access
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
