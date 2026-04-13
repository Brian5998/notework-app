'use client'

export default function Hero() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem' }}>
      <div
        style={{
          paddingTop: '10rem',
          paddingBottom: '5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '4rem',
          alignItems: 'center',
        }}
      >
        {/* Left: copy */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              background: 'var(--accent-light)',
              padding: '0.35rem 0.85rem',
              borderRadius: '100px',
              marginBottom: '1.5rem',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            Now in private beta
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: 'clamp(2.6rem, 5vw, 3.8rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              marginBottom: '1.5rem',
            }}
          >
            You don&apos;t lose notes.
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
              You just can&apos;t find them
            </em>{' '}
            when it matters.
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--ink-muted)',
              lineHeight: 1.75,
              marginBottom: '2.5rem',
              maxWidth: 420,
            }}
          >
            Notework is infrastructure for your knowledge — not an AI that thinks
            for you, but a system that makes sure you don&apos;t lose or contradict
            what you already know. Search, flag, link, quiz, and evolve.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="#waitlist"
              style={{
                background: 'var(--ink)',
                color: 'var(--bg)',
                padding: '0.8rem 1.75rem',
                borderRadius: '100px',
                fontSize: '0.9rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'opacity 0.2s, transform 0.15s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                const el = e.target as HTMLElement
                el.style.opacity = '0.82'
                el.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                const el = e.target as HTMLElement
                el.style.opacity = '1'
                el.style.transform = ''
              }}
            >
              Get early access
            </a>
            <a
              href="#features"
              style={{
                background: 'transparent',
                color: 'var(--ink)',
                padding: '0.8rem 1.75rem',
                borderRadius: '100px',
                fontSize: '0.9rem',
                fontWeight: 400,
                textDecoration: 'none',
                border: '0.5px solid var(--border-strong)',
                transition: 'background 0.2s, transform 0.15s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                const el = e.target as HTMLElement
                el.style.background = 'var(--bg-card)'
                el.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                const el = e.target as HTMLElement
                el.style.background = 'transparent'
                el.style.transform = ''
              }}
            >
              See how it works →
            </a>
          </div>
        </div>

        {/* Right: node graph SVG */}
        <div style={{ position: 'relative', height: 420 }}>
          <svg
            viewBox="0 0 460 380"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%', opacity: 0.92 }}
          >
            <defs>
              <marker
                id="arr"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6 Z"
                  fill="var(--accent-mid)"
                  opacity="0.5"
                />
              </marker>
            </defs>
            {/* connection lines */}
            <line
              x1="230" y1="175" x2="130" y2="100"
              stroke="var(--accent-mid)" strokeWidth="0.8" opacity="0.4"
              markerEnd="url(#arr)"
            />
            <line
              x1="230" y1="175" x2="340" y2="95"
              stroke="var(--accent-mid)" strokeWidth="0.8" opacity="0.4"
              markerEnd="url(#arr)"
            />
            <line
              x1="230" y1="175" x2="110" y2="255"
              stroke="var(--accent-mid)" strokeWidth="0.8" opacity="0.4"
              markerEnd="url(#arr)"
            />
            <line
              x1="230" y1="175" x2="360" y2="270"
              stroke="var(--accent-mid)" strokeWidth="0.8" opacity="0.4"
              markerEnd="url(#arr)"
            />
            <line x1="130" y1="100" x2="60" y2="145" stroke="var(--border-strong)" strokeWidth="0.6" opacity="0.5"/>
            <line x1="340" y1="95" x2="420" y2="140" stroke="var(--border-strong)" strokeWidth="0.6" opacity="0.5"/>
            <line x1="110" y1="255" x2="55" y2="310" stroke="var(--border-strong)" strokeWidth="0.6" opacity="0.5"/>
            <line x1="360" y1="270" x2="415" y2="325" stroke="var(--border-strong)" strokeWidth="0.6" opacity="0.5"/>
            <line x1="130" y1="100" x2="340" y2="95" stroke="var(--border-strong)" strokeWidth="0.6" opacity="0.3" strokeDasharray="4 4"/>
            <line x1="110" y1="255" x2="360" y2="270" stroke="var(--border-strong)" strokeWidth="0.6" opacity="0.3" strokeDasharray="4 4"/>
            {/* conflict indicator */}
            <line x1="130" y1="100" x2="110" y2="255" stroke="#E24B4A" strokeWidth="1" opacity="0.5" strokeDasharray="5 3"/>
            {/* center node */}
            <circle cx="230" cy="175" r="36" fill="var(--accent)" opacity="0.12"/>
            <circle cx="230" cy="175" r="24" fill="var(--accent)" opacity="0.25"/>
            <circle cx="230" cy="175" r="12" fill="var(--accent)"/>
            {/* secondary nodes */}
            <circle cx="130" cy="100" r="18" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="1"/>
            <circle cx="340" cy="95" r="18" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="1"/>
            <circle cx="110" cy="255" r="18" fill="var(--bg-card)" stroke="#E24B4A" strokeWidth="1"/>
            <circle cx="360" cy="270" r="18" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="1"/>
            {/* tertiary nodes */}
            <circle cx="60" cy="145" r="10" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="0.8"/>
            <circle cx="420" cy="140" r="10" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="0.8"/>
            <circle cx="55" cy="310" r="10" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="0.8"/>
            <circle cx="415" cy="325" r="10" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="0.8"/>
            {/* labels */}
            <text x="230" y="230" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="10" fill="var(--ink-muted)">your notes</text>
            <text x="130" y="74" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="9" fill="var(--ink-muted)">Biology 201</text>
            <text x="340" y="70" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="9" fill="var(--ink-muted)">Chemistry</text>
            <text x="105" y="285" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="9" fill="#E24B4A">conflict ⚡</text>
            <text x="365" y="300" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="9" fill="var(--ink-muted)">Oct 3rd</text>
            {/* search bar mockup */}
            <rect x="60" y="335" width="340" height="32" rx="16" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="0.5"/>
            <text x="85" y="356" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="var(--ink-faint)">Search across all notes...</text>
            <circle cx="376" cy="351" r="8" fill="var(--accent)" opacity="0.8"/>
            <line x1="371" y1="347" x2="373" y2="353" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="371" cy="349" r="3" fill="none" stroke="white" strokeWidth="1.2"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
