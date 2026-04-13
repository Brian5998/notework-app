'use client'

export default function Footer() {
  return (
    <footer
      style={{
        padding: '3rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        borderTop: '0.5px solid var(--border)',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <div>
        <a
          href="#"
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: '1.1rem',
            color: 'var(--ink)',
            textDecoration: 'none',
          }}
        >
          Note<span style={{ color: 'var(--accent)' }}>work</span>
        </a>
        <div style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginTop: '0.2rem' }}>
          Infrastructure for your knowledge.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
        {['About', 'Blog', 'Twitter / X', 'Contact'].map((label) => (
          <a
            key={label}
            href="#"
            style={{
              fontSize: '0.875rem',
              color: 'var(--ink-muted)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--ink)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--ink-muted)')}
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}
