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
  { label: 'Handwritten note scanning', has: true },
  { label: 'Import from Notion, Obsidian', has: true },
  { label: 'Priority support', has: true },
]

function CheckRow({ has, label, accent }: { has: boolean; label: string; accent?: boolean }) {
  return (
    <li
      style={{
        fontSize: '14px',
        color: has ? 'var(--m-text)' : 'var(--m-text-2)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
      }}
    >
      {has ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent ? 'var(--m-accent)' : 'var(--m-accent)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <span style={{ color: 'var(--m-text-3)', fontSize: '14px', flexShrink: 0, width: 14, textAlign: 'center' }}>—</span>
      )}
      {label}
    </li>
  )
}

export default function PricingSection() {
  return (
    <section id="pricing" style={{ padding: '7rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <FadeUp>
        <div className="label" style={{ marginBottom: '1rem' }}>
          Pricing
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
          }}
        >
          Simple,{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--m-accent)' }}>student-friendly</em>{' '}
          pricing.
        </h2>
        <p style={{ fontSize: '17px', color: 'var(--m-text-2)', maxWidth: 560, marginBottom: '0', lineHeight: 1.7 }}>
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
              background: 'var(--m-surface)',
              border: '1px solid var(--m-border)',
              borderRadius: 18,
              padding: '2.5rem',
            }}
          >
            <div
              className="font-syne"
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
                padding: '4px 12px',
                borderRadius: '100px',
                border: '1px solid var(--m-border-bright)',
                color: 'var(--m-text-2)',
              }}
            >
              Free
            </div>
            <div className="font-serif-d" style={{ fontSize: '24px', letterSpacing: '-0.01em', marginBottom: '0.6rem', color: 'var(--m-text)' }}>
              Starter
            </div>
            <div
              className="font-serif-d"
              style={{ fontSize: '48px', fontWeight: 400, letterSpacing: '-0.03em', marginBottom: '0.4rem', color: 'var(--m-text)', lineHeight: 1 }}
            >
              $0
              <span style={{ fontSize: '15px', color: 'var(--m-text-2)', fontFamily: 'var(--font-dm-sans), sans-serif', marginLeft: 6 }}>
                / month
              </span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--m-text-2)', marginBottom: '2rem', lineHeight: 1.6 }}>
              Everything you need to get started. No credit card required.
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0 }}>
              {starterFeatures.map((f) => (
                <CheckRow key={f.label} has={f.has} label={f.label} />
              ))}
            </ul>
          </div>

          {/* Scholar */}
          <div
            style={{
              background: 'var(--m-accent-dim)',
              border: '1px solid var(--m-accent-border)',
              borderRadius: 18,
              padding: '2.5rem',
              position: 'relative',
            }}
          >
            <div
              className="font-syne"
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
                padding: '4px 12px',
                borderRadius: '100px',
                border: '1px solid var(--m-accent-border)',
                color: 'var(--m-accent)',
                background: 'rgba(126, 232, 162, 0.08)',
              }}
            >
              Scholar
            </div>
            <div className="font-serif-d" style={{ fontSize: '24px', letterSpacing: '-0.01em', marginBottom: '0.6rem', color: 'var(--m-text)' }}>
              Scholar
            </div>
            <div
              className="font-serif-d"
              style={{ fontSize: '48px', fontWeight: 400, letterSpacing: '-0.03em', marginBottom: '0.4rem', color: 'var(--m-text)', lineHeight: 1 }}
            >
              $15
              <span style={{ fontSize: '15px', color: 'var(--m-text-2)', fontFamily: 'var(--font-dm-sans), sans-serif', marginLeft: 6 }}>
                / 3 months
              </span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--m-text-2)', marginBottom: '2rem', lineHeight: 1.6 }}>
              Join the waitlist for early-access pricing — locked in for life.
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0 }}>
              {scholarFeatures.map((f) => (
                <CheckRow key={f.label} has={f.has} label={f.label} accent />
              ))}
            </ul>
          </div>
        </div>

        <p
          className="font-mono"
          style={{
            marginTop: '3rem',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--m-text-3)',
            letterSpacing: '0.02em',
          }}
        >
          Pricing announced at launch. Waitlist members receive early-access rates, permanently.
        </p>
      </FadeUp>
    </section>
  )
}
