import FadeUp from './FadeUp'

interface FeatureBlockProps {
  num: string
  title: string
  body: string
  reverse?: boolean
  preview: React.ReactNode
}

export default function FeatureBlock({ num, title, body, reverse = false, preview }: FeatureBlockProps) {
  return (
    <FadeUp>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '4rem',
          alignItems: 'center',
          padding: '3.5rem 0',
          borderBottom: '0.5px solid var(--border)',
          direction: reverse ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ direction: 'ltr' }}>
          <div
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: '0.875rem',
              color: 'var(--ink-faint)',
              marginBottom: '0.75rem',
              fontStyle: 'italic',
            }}
          >
            {num}
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: '1.75rem',
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: '0.75rem',
              color: 'var(--ink)',
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--ink-muted)', lineHeight: 1.75 }}>{body}</p>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            height: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            direction: 'ltr',
          }}
        >
          {preview}
        </div>
      </div>
    </FadeUp>
  )
}
