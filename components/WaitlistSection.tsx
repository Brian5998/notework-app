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
      // fire-and-forget
    }
    setStatus('success')
  }

  return (
    <div
      id="waitlist"
      style={{
        background: 'var(--m-bg)',
        borderTop: '1px solid var(--m-border)',
        borderBottom: '1px solid var(--m-border)',
        padding: '7rem 2.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <div className="label" style={{ marginBottom: '1.25rem' }}>
          Join the waitlist
        </div>
        <h2
          className="font-serif-d"
          style={{
            fontSize: 'clamp(2rem, 4.2vw, 48px)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--m-text)',
            marginBottom: '1.25rem',
            fontWeight: 400,
          }}
        >
          Be the first to know{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--m-accent)' }}>
            when Notework launches.
          </em>
        </h2>
        <p style={{ color: 'var(--m-text-2)', marginBottom: '2.5rem', fontSize: '16px', lineHeight: 1.7 }}>
          Early access for waitlist members. Priority pricing locked in at signup. No spam — one email when we&apos;re ready.
        </p>

        {status === 'success' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              fontSize: '15px',
              color: 'var(--m-accent)',
              padding: '1rem',
              background: 'var(--m-accent-dim)',
              border: '1px solid var(--m-accent-border)',
              borderRadius: 10,
              maxWidth: 420,
              margin: '0 auto',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--m-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            You&apos;re on the list. We&apos;ll be in touch.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              maxWidth: 460,
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
              className="font-mono"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${status === 'error' ? 'rgba(245, 200, 66, 0.5)' : 'var(--m-border)'}`,
                background: 'var(--m-surface)',
                color: 'var(--m-text)',
                fontFamily: 'var(--font-dm-mono), ui-monospace, monospace',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.18s',
              }}
              onFocus={(e) => {
                if (status !== 'error') e.currentTarget.style.borderColor = 'var(--m-border-bright)'
              }}
              onBlur={(e) => {
                if (status !== 'error') e.currentTarget.style.borderColor = 'var(--m-border)'
              }}
            />
            <button onClick={handleSubmit} className="btn-accent" style={{ padding: '12px 22px' }}>
              Get early access
            </button>
          </div>
        )}

        <p
          className="font-mono"
          style={{
            marginTop: '1.5rem',
            fontSize: '12px',
            color: 'var(--m-text-3)',
            letterSpacing: '0.02em',
          }}
        >
          No spam. Ever. Unsubscribe in one click.
        </p>
      </div>
    </div>
  )
}
