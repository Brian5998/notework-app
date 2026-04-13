'use client'

import FadeUp from './FadeUp'

const problems = [
  {
    title: 'Lost in the archive',
    body: 'You wrote it. It exists. But when you need it three weeks later, it may as well not exist at all. Notes with no retrieval are just expensive forgetting.',
    icon: (
      <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, stroke: 'var(--accent)', fill: 'none', strokeWidth: 1.5 }}>
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
  },
  {
    title: 'Islands of knowledge',
    body: "That biology concept that clarifies your chemistry problem set — you'll never notice the connection unless something surfaces it. Most tools never do.",
    delay: 0.1,
    icon: (
      <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, stroke: 'var(--accent)', fill: 'none', strokeWidth: 1.5 }}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    title: 'Silent contradictions',
    body: "You wrote something wrong in September and corrected it in November — except you kept both versions. No tool tells you when you're arguing against yourself.",
    delay: 0.2,
    icon: (
      <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, stroke: 'var(--accent)', fill: 'none', strokeWidth: 1.5 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
]

export default function ProblemSection() {
  return (
    <section id="problem" style={{ padding: '7rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
          The problem
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 'clamp(1.9rem, 3.5vw, 2.7rem)',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            color: 'var(--ink)',
          }}
        >
          Notes become static archives
          <br />
          the moment you stop writing.
        </h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--ink-muted)', maxWidth: 520, marginBottom: '3.5rem' }}>
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
          gap: '1.5rem',
        }}
      >
        {problems.map((p) => (
          <FadeUp key={p.title} delay={(p as { delay?: number }).delay ?? 0}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = '')}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                {p.icon}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                  fontSize: '1.15rem',
                  lineHeight: 1.3,
                  marginBottom: '0.6rem',
                  letterSpacing: '-0.01em',
                  color: 'var(--ink)',
                }}
              >
                {p.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', lineHeight: 1.65 }}>{p.body}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}
