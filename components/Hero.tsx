'use client'

export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem 5rem',
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
          top: '50%',
          left: '50%',
          width: 720,
          height: 320,
          transform: 'translate(-50%, -45%)',
          background: 'radial-gradient(ellipse, rgba(126,232,162,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 760, width: '100%', textAlign: 'center' }}>
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
            marginBottom: '2.25rem',
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
          Now in private beta
        </div>

        {/* Headline */}
        <h1
          className="font-serif-d"
          style={{
            fontSize: 'clamp(2.6rem, 6.5vw, 72px)',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            color: 'var(--m-text)',
            marginBottom: '1.75rem',
            fontWeight: 400,
          }}
        >
          You don&apos;t lose notes.
          <br />
          <em
            style={{
              fontStyle: 'italic',
              color: 'var(--m-accent)',
              fontWeight: 400,
            }}
          >
            You just can&apos;t find them
          </em>
          <br />
          when it matters.
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: '21px',
            lineHeight: 1.6,
            color: 'var(--m-text-2)',
            maxWidth: 600,
            margin: '0 auto 2.75rem',
          }}
        >
          Notework is infrastructure for your knowledge — not an AI that thinks
          for you, but a system that makes sure you don&apos;t lose or contradict
          what you already know. Search, flag, link, quiz, and evolve.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#waitlist" className="btn-accent">
            Get early access
          </a>
          <a href="#features" className="btn-ghost">
            See how it works →
          </a>
        </div>
      </div>
    </section>
  )
}
