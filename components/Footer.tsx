'use client'

export default function Footer() {
  return (
    <footer
      style={{
        padding: '2rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        borderTop: '1px solid var(--m-border)',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <a
          href="#"
          className="font-syne"
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: 'var(--m-text)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 2,
          }}
        >
          Notework
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--m-accent)',
            }}
          />
        </a>
        <span
          className="font-mono"
          style={{ fontSize: '12px', color: 'var(--m-text-3)' }}
        >
          Infrastructure for your knowledge.
        </span>
      </div>

      <div className="font-syne" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {['About', 'Blog', 'Twitter / X', 'Contact'].map((label) => (
          <a key={label} href="#" className="nav-link" style={{ fontSize: '12px' }}>
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}
