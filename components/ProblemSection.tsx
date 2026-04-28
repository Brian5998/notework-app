'use client'

import FadeUp from './FadeUp'

const problems = [
  {
    title: 'Lost in the archive',
    body: 'You wrote it. It exists. But when you need it three weeks later, it may as well not exist at all. Notes with no retrieval are just expensive forgetting.',
    shape: (
      <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'var(--m-accent)', fill: 'none', strokeWidth: 1.4 }}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 3v18" />
      </svg>
    ),
  },
  {
    title: 'Islands of knowledge',
    body: "That biology concept that clarifies your chemistry problem set — you'll never notice the connection unless something surfaces it. Most tools never do.",
    delay: 0.1,
    shape: (
      <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'var(--m-accent)', fill: 'none', strokeWidth: 1.4 }}>
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="18" r="3" />
        <path d="M9 6h6M6 9v6M15 18h6M18 9v6" />
      </svg>
    ),
  },
  {
    title: 'Silent contradictions',
    body: "You wrote something wrong in September and corrected it in November — except you kept both versions. No tool tells you when you're arguing against yourself.",
    delay: 0.2,
    shape: (
      <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'var(--m-accent)', fill: 'none', strokeWidth: 1.4 }}>
        <polygon points="12,3 21,20 3,20" />
        <line x1="12" y1="10" x2="12" y2="14" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
]

export default function ProblemSection() {
  return (
    <section id="problem" style={{ padding: '7rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <FadeUp>
        <div className="label" style={{ marginBottom: '1rem' }}>
          The problem
        </div>
        <h2
          className="font-serif-d"
          style={{
            fontSize: 'clamp(2rem, 4.2vw, 48px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '1.25rem',
            color: 'var(--m-text)',
            fontWeight: 400,
            maxWidth: 720,
          }}
        >
          Notes become{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--m-accent)' }}>static archives</em>
          <br />
          the moment you stop writing.
        </h2>
        <p style={{ fontSize: '17px', color: 'var(--m-text-2)', maxWidth: 560, marginBottom: '4rem', lineHeight: 1.7 }}>
          Students don&apos;t fail because they take bad notes. They fail because
          they can&apos;t find what they wrote when it becomes relevant, don&apos;t
          realize that ideas across two different classes connect, and never catch
          something they wrote wrong weeks earlier. The real problem isn&apos;t
          storage — it&apos;s retrieval and consistency.
        </p>
      </FadeUp>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {problems.map((p) => (
          <FadeUp key={p.title} delay={(p as { delay?: number }).delay ?? 0}>
            <div
              className="e-card e-card-accent"
              style={{ padding: '2rem 1.85rem', height: '100%' }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'var(--m-accent-dim)',
                  border: '1px solid var(--m-accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                {p.shape}
              </div>
              <h3
                className="font-serif-d"
                style={{
                  fontSize: '20px',
                  lineHeight: 1.3,
                  marginBottom: '0.7rem',
                  letterSpacing: '-0.01em',
                  color: 'var(--m-text)',
                  fontWeight: 400,
                }}
              >
                {p.title}
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--m-text-2)', lineHeight: 1.65 }}>{p.body}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}
