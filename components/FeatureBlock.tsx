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
          padding: '4rem 0',
          borderBottom: '1px solid var(--m-border)',
          direction: reverse ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ direction: 'ltr' }}>
          <div
            className="font-syne"
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--m-accent)',
              background: 'var(--m-accent-dim)',
              border: '1px solid var(--m-accent-border)',
              padding: '4px 10px',
              borderRadius: '100px',
              marginBottom: '1.1rem',
            }}
          >
            {num}
          </div>
          <h3
            className="font-serif-d"
            style={{
              fontSize: '28px',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              marginBottom: '0.85rem',
              color: 'var(--m-text)',
              fontWeight: 400,
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: '16px', color: 'var(--m-text-2)', lineHeight: 1.7, maxWidth: 460 }}>{body}</p>
        </div>

        <div
          className="e-card"
          style={{
            height: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            direction: 'ltr',
            padding: 24,
          }}
        >
          {preview}
        </div>
      </div>
    </FadeUp>
  )
}
