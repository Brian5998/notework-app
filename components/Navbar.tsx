'use client'

export default function Navbar() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2.5rem',
        background: 'var(--bg)',
        borderBottom: '0.5px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <a
        href="#"
        style={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontSize: '1.35rem',
          color: 'var(--ink)',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
        }}
      >
        Note<span style={{ color: 'var(--accent)' }}>work</span>
      </a>

      <div className="hidden sm:flex items-center gap-8">
        {(['Features', 'Compare', 'Pricing'] as const).map((label) => (
          <a
            key={label}
            href={`#${label.toLowerCase()}`}
            style={{
              fontSize: '0.875rem',
              color: 'var(--ink-muted)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = 'var(--ink)')
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = 'var(--ink-muted)')
            }
          >
            {label}
          </a>
        ))}
        <a
          href="/app"
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
            padding: '0.5rem 1.25rem',
            borderRadius: '100px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '0.8')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '1')}
        >
          Open app
        </a>
      </div>
    </nav>
  )
}
