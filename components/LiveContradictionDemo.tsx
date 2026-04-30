'use client'

import { useState, useEffect, useRef } from 'react'

type Stage = 'idle' | 'scanning' | 'caught'

const SAMPLE_NOTES = [
  {
    id: 'sept',
    date: 'Sept 14',
    title: 'Cellular Respiration',
    course: 'BIO 201',
    excerpt:
      'Net yield: ~38 ATP per glucose. Glycolysis 2, Krebs 2, Electron Transport ~34. Oxygen is the final electron acceptor.',
    highlight: '~38 ATP per glucose',
  },
  {
    id: 'nov',
    date: 'Nov 8',
    title: 'Respiration ATP Yield (revised)',
    course: 'BIO 201',
    excerpt:
      "Updated after Prof's lecture: the realistic yield per glucose is closer to 30–32 ATP. Proton leak + NADH transport eat the difference.",
    highlight: '30–32 ATP per glucose',
  },
  {
    id: 'oct',
    date: 'Oct 22',
    title: 'Game Theory Basics',
    course: 'ECON 101',
    excerpt:
      'Nash Equilibrium: no player can improve by unilaterally changing strategy. Prisoner\'s Dilemma — individually rational, collectively worse.',
  },
]

const FLAG_EXPLANATION =
  'Same concept, two different numbers. Your September note says ~38 ATP per glucose; your November note revises it to 30–32. Reviewers (and exam graders) will catch one and not the other.'

export default function LiveContradictionDemo() {
  const [stage, setStage] = useState<Stage>('idle')
  const stageRef = useRef<Stage>('idle')

  useEffect(() => {
    stageRef.current = stage
  }, [stage])

  function runDemo() {
    if (stage !== 'idle') return
    setStage('scanning')
    setTimeout(() => {
      if (stageRef.current === 'scanning') setStage('caught')
    }, 1700)
  }

  function reset() {
    setStage('idle')
  }

  const flagged = stage === 'caught'

  return (
    <div
      style={{
        background: 'var(--m-surface)',
        border: '1px solid var(--m-border-bright)',
        borderRadius: 22,
        padding: '1.5rem',
        boxShadow:
          '0 28px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
        textAlign: 'left',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.1rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: stage === 'scanning' ? '#fbbf24' : flagged ? '#ef4444' : '#7EE8A2',
              boxShadow: `0 0 12px ${stage === 'scanning' ? '#fbbf24' : flagged ? '#ef4444' : '#7EE8A2'}`,
              transition: 'background 0.3s, box-shadow 0.3s',
            }}
          />
          <span
            className="font-syne"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--m-text-2)',
            }}
          >
            {stage === 'idle'
              ? 'Live demo · 3 sample notes'
              : stage === 'scanning'
                ? 'Scanning your notes…'
                : '1 contradiction caught'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {stage === 'idle' ? (
            <button
              onClick={runDemo}
              style={demoActionStyle('accent')}
            >
              Show me a contradiction →
            </button>
          ) : (
            <button onClick={reset} style={demoActionStyle('ghost')}>
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* Notes grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {SAMPLE_NOTES.map((note) => {
          const isInvolved =
            flagged && (note.id === 'sept' || note.id === 'nov')
          return (
            <div
              key={note.id}
              style={{
                position: 'relative',
                background: isInvolved
                  ? 'rgba(239,68,68,0.06)'
                  : 'var(--m-surface-raised)',
                borderTop: `1px solid ${isInvolved ? 'rgba(239,68,68,0.4)' : 'var(--m-border)'}`,
                borderRight: `1px solid ${isInvolved ? 'rgba(239,68,68,0.4)' : 'var(--m-border)'}`,
                borderBottom: `1px solid ${isInvolved ? 'rgba(239,68,68,0.4)' : 'var(--m-border)'}`,
                borderLeft: `3px solid ${isInvolved ? '#ef4444' : 'var(--m-accent)'}`,
                borderRadius: 12,
                padding: '0.95rem 1rem',
                transition: 'border-color 0.4s, background 0.4s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem',
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: '11px',
                    color: 'var(--m-text-3)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {note.course} · {note.date}
                </span>
                {isInvolved && (
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                  fontSize: '17px',
                  color: 'var(--m-text)',
                  marginBottom: '0.35rem',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.25,
                }}
              >
                {note.title}
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--m-text-2)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {note.excerpt
                  .split(note.highlight ?? '')
                  .map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <mark
                          style={{
                            background: isInvolved
                              ? 'rgba(239,68,68,0.18)'
                              : 'transparent',
                            color: isInvolved ? '#fca5a5' : 'inherit',
                            padding: isInvolved ? '0 4px' : 0,
                            borderRadius: 4,
                            fontWeight: isInvolved ? 600 : 400,
                            transition: 'background 0.4s, color 0.4s',
                          }}
                        >
                          {note.highlight}
                        </mark>
                      )}
                    </span>
                  ))}
              </p>
            </div>
          )
        })}
      </div>

      {/* Flag panel — only shows after scan */}
      <div
        style={{
          marginTop: '1.1rem',
          opacity: flagged ? 1 : 0,
          maxHeight: flagged ? 320 : 0,
          overflow: 'hidden',
          transition: 'opacity 0.5s ease, max-height 0.5s ease',
        }}
      >
        <div
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 14,
            padding: '1rem 1.15rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(239,68,68,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2.2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="font-syne"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#fca5a5',
                marginBottom: '0.35rem',
              }}
            >
              Contradiction
            </div>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--m-text)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {FLAG_EXPLANATION}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
              <a
                href="/app"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'rgba(239,68,68,0.18)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239,68,68,0.4)',
                  padding: '7px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-syne), system-ui, sans-serif',
                  letterSpacing: '0.02em',
                }}
              >
                Resolve in the app →
              </a>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--m-text-3)',
                  alignSelf: 'center',
                }}
              >
                No competitor flags this. That&apos;s the point.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function demoActionStyle(variant: 'accent' | 'ghost'): React.CSSProperties {
  const isAccent = variant === 'accent'
  return {
    background: isAccent ? 'var(--m-accent)' : 'transparent',
    color: isAccent ? '#0C0C0E' : 'var(--m-text-2)',
    border: isAccent ? 'none' : '1px solid var(--m-border-bright)',
    fontFamily: 'var(--font-syne), system-ui, sans-serif',
    fontSize: '13px',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: '0.01em',
  }
}
