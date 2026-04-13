import FadeUp from './FadeUp'

const starterFeatures = [
  { label: 'Unlimited notes', has: true },
  { label: 'Basic keyword search', has: true },
  { label: 'Note linking (manual)', has: true },
  { label: 'Timeline view', has: true },
  { label: 'Semantic search', has: false },
  { label: 'Contradiction flagging', has: false },
  { label: 'Forest View', has: false },
  { label: 'Quiz mode', has: false },
  { label: 'Knowledge insights', has: false },
]

const scholarFeatures = [
  { label: 'Everything in Starter', has: true },
  { label: 'Semantic search', has: true },
  { label: 'Contradiction flagging', has: true },
  { label: 'Forest View', has: true },
  { label: 'AI concept suggestions', has: true },
  { label: 'Quiz mode from your notes', has: true },
  { label: 'Knowledge evolution tracking', has: true },
  { label: 'Concept heatmap', has: true },
  { label: 'Import from Notion, Obsidian', has: true },
  { label: 'Priority support', has: true },
]

export default function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '7rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
          Pricing
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
          Simple, student-friendly pricing.
        </h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--ink-muted)', maxWidth: 520, marginBottom: '0' }}>
          Start free. Upgrade when your notes start working for you.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginTop: '3rem',
          }}
        >
          {/* Starter */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.25rem',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '100px',
                border: '0.5px solid var(--border-strong)',
                color: 'var(--ink-muted)',
              }}
            >
              Free
            </div>
            <div style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', fontSize: '1.6rem', letterSpacing: '-0.02em', marginBottom: '0.4rem', color: 'var(--ink)' }}>
              Starter
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 300, letterSpacing: '-0.04em', marginBottom: '0.25rem', color: 'var(--ink)' }}>
              $0{' '}
              <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--ink-muted)' }}>/ month</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: '1.75rem' }}>
              Everything you need to get started. No credit card required.
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {starterFeatures.map((f) => (
                <li
                  key={f.label}
                  style={{
                    fontSize: '0.875rem',
                    color: f.has ? 'var(--ink)' : 'var(--ink-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                  }}
                >
                  <span style={{ color: f.has ? 'var(--accent)' : 'var(--ink-faint)', fontSize: f.has ? '1em' : '0.75rem', flexShrink: 0 }}>
                    {f.has ? '✓' : '—'}
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Scholar */}
          <div
            style={{
              background: '#1A1917',
              border: '0.5px solid #1A1917',
              borderRadius: 'var(--radius-lg)',
              padding: '2.25rem',
              color: 'rgba(240,238,232,0.9)',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '100px',
                border: '0.5px solid rgba(240,238,232,0.2)',
                color: 'rgba(240,238,232,0.7)',
              }}
            >
              Premium
            </div>
            <div style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', fontSize: '1.6rem', letterSpacing: '-0.02em', marginBottom: '0.4rem', color: 'rgba(240,238,232,0.9)' }}>
              Scholar
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 300, letterSpacing: '-0.04em', marginBottom: '0.25rem', color: 'rgba(240,238,232,0.9)' }}>
              $15{' '}
              <span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(240,238,232,0.5)' }}>/ month</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(240,238,232,0.6)', marginBottom: '1.75rem' }}>
              Join the waitlist for early-access pricing — locked in for life.
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {scholarFeatures.map((f) => (
                <li
                  key={f.label}
                  style={{
                    fontSize: '0.875rem',
                    color: 'rgba(240,238,232,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                  }}
                >
                  <span style={{ color: '#5CB87A', flexShrink: 0 }}>✓</span>
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p
          style={{
            marginTop: '3rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          }}
        >
          Pricing announced at launch. Waitlist members receive early-access rates, permanently.
        </p>
      </FadeUp>
    </section>
  )
}
