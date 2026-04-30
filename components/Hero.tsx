'use client'

import LiveContradictionDemo from './LiveContradictionDemo'

export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5rem 2rem 4rem',
        overflow: 'hidden',
      }}
    >
      {/* Animated grid background */}
      <div
        className="hero-grid"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* Soft accent glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: 880,
          height: 360,
          transform: 'translate(-50%, -45%)',
          background: 'radial-gradient(ellipse, rgba(126,232,162,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 1100,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '3.25rem',
          textAlign: 'center',
        }}
      >
        <div>
          {/* Badge */}
          <div
            className="font-syne"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--m-accent)',
              background: 'var(--m-accent-dim)',
              border: '1px solid var(--m-accent-border)',
              padding: '8px 18px',
              borderRadius: '100px',
              marginBottom: '2rem',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--m-accent)',
                boxShadow: '0 0 8px var(--m-accent)',
                display: 'inline-block',
              }}
            />
            Organizational infrastructure for your knowledge
          </div>

          {/* Headline — leads with organization */}
          <h1
            className="font-serif-d"
            style={{
              fontSize: 'clamp(2.6rem, 6.5vw, 76px)',
              lineHeight: 1.0,
              letterSpacing: '-0.022em',
              color: 'var(--m-text)',
              marginBottom: '1.75rem',
              fontWeight: 400,
              maxWidth: 980,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Your scattered notes,{' '}
            <em
              style={{
                fontStyle: 'italic',
                color: 'var(--m-accent)',
                fontWeight: 400,
              }}
            >
              finally organized
            </em>
            .
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: '21px',
              lineHeight: 1.6,
              color: 'var(--m-text-2)',
              maxWidth: 660,
              margin: '0 auto 2.5rem',
            }}
          >
            Notework is the layer that connects everything you&apos;ve ever
            written — courses, journals, meetings — into a single searchable
            map. It surfaces the notes that should connect, catches the ones
            that contradict, and turns clusters of ideas into study sheets.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <a href="/app" className="btn-accent">
              Try it free →
            </a>
            <a href="#features" className="btn-ghost">
              See how it works
            </a>
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--m-text-3)',
              marginTop: '0.85rem',
            }}
          >
            No signup. Built by Princeton students.
          </p>
        </div>

        {/* Live demo widget */}
        <div style={{ width: '100%', maxWidth: 920, margin: '0 auto' }}>
          <LiveContradictionDemo />
        </div>
      </div>
    </section>
  )
}
