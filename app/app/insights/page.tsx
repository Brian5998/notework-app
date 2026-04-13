'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useNotes } from '@/lib/NotesContext'

type Topic = { name: string; count: number; noteIds: string[] }
type EvolutionEntry = {
  noteTitle: string
  date: string
  understanding: string
  change: 'initial' | 'deepened' | 'revised' | 'contradicted' | 'refined'
}
type Concept = { name: string; timeline: EvolutionEntry[]; summary: string }

const CHANGE_COLORS: Record<string, string> = {
  initial: 'var(--accent)',
  deepened: '#3B82F6',
  revised: '#D97706',
  contradicted: 'var(--conflict)',
  refined: '#8B5CF6',
}

export default function InsightsPage() {
  const { notes } = useNotes()
  const [tab, setTab] = useState<'heatmap' | 'evolution'>('heatmap')
  const [topics, setTopics] = useState<Topic[]>([])
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [isLoadingTopics, setIsLoadingTopics] = useState(false)
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false)
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null)
  const heatmapFetchedRef = useRef(false)
  const evolutionFetchedRef = useRef(false)

  useEffect(() => {
    if (tab === 'heatmap' && !heatmapFetchedRef.current && notes.length > 0) {
      heatmapFetchedRef.current = true
      setIsLoadingTopics(true)
      fetch('/api/heatmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
        .then((r) => r.json())
        .then((d) => setTopics(d.topics ?? []))
        .finally(() => setIsLoadingTopics(false))
    }
  }, [tab, notes])

  useEffect(() => {
    if (tab === 'evolution' && !evolutionFetchedRef.current && notes.length >= 2) {
      evolutionFetchedRef.current = true
      setIsLoadingEvolution(true)
      fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
        .then((r) => r.json())
        .then((d) => setConcepts(d.concepts ?? []))
        .finally(() => setIsLoadingEvolution(false))
    }
  }, [tab, notes])

  const maxCount = topics.length > 0 ? topics[0].count : 1

  if (notes.length === 0) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--bg)',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          color: 'var(--ink-faint)',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, stroke: 'var(--ink-faint)', fill: 'none', strokeWidth: 1.2, opacity: 0.5 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p style={{ fontSize: '0.95rem' }}>Add notes to see insights about your knowledge.</p>
        <Link href="/app" style={{ color: 'var(--accent)', fontSize: '0.82rem', textDecoration: 'none' }}>
          ← Back to notes
        </Link>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1.25rem',
          borderBottom: '0.5px solid var(--border)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        <Link href="/app" style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', textDecoration: 'none' }}>
          ← Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', fontSize: '0.95rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Note<span style={{ color: 'var(--accent)' }}>work</span>
          </span>
          <span style={{ color: 'var(--ink-faint)', fontSize: '0.75rem' }}>Insights</span>
        </div>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 2rem 4rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
          }}
        >
          Knowledge Insights
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', marginBottom: '2rem' }}>
          See what you write about most, and how your understanding evolves.
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
          {([['heatmap', 'Concept Map'], ['evolution', 'Evolution']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '0.45rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: tab === key ? 'var(--accent)' : 'transparent',
                color: tab === key ? '#fff' : 'var(--ink-muted)',
                transition: 'all 0.15s',
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Heatmap tab */}
        {tab === 'heatmap' && (
          <>
            {isLoadingTopics ? (
              <LoadingSpinner label="Analyzing your concepts..." />
            ) : topics.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)' }}>
                Not enough content to extract topics. Try writing more detailed notes.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {topics.map((topic) => {
                  const intensity = topic.count / maxCount
                  const size = 0.8 + intensity * 0.6
                  const opacity = 0.35 + intensity * 0.65
                  return (
                    <div
                      key={topic.name}
                      title={`${topic.name}: appears in ${topic.count} note${topic.count !== 1 ? 's' : ''}`}
                      style={{
                        padding: `${0.4 + intensity * 0.3}rem ${0.7 + intensity * 0.5}rem`,
                        borderRadius: 100,
                        background: `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--accent-light))`,
                        color: intensity > 0.6 ? '#fff' : 'var(--accent)',
                        fontSize: `${size}rem`,
                        fontWeight: intensity > 0.5 ? 500 : 400,
                        opacity,
                        cursor: 'default',
                        transition: 'transform 0.15s',
                        lineHeight: 1.3,
                        border: `0.5px solid color-mix(in srgb, var(--accent) ${Math.round(intensity * 60)}%, transparent)`,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = '' }}
                    >
                      {topic.name}
                      <span style={{
                        marginLeft: '0.35rem',
                        fontSize: '0.7em',
                        opacity: 0.8,
                      }}>
                        {topic.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Bar chart */}
            {!isLoadingTopics && topics.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <h3 style={{
                  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                  fontSize: '1.05rem',
                  color: 'var(--ink)',
                  marginBottom: '1.25rem',
                }}>
                  Frequency breakdown
                </h3>
                {topics.map((topic) => (
                  <div key={topic.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <span style={{ width: 100, fontSize: '0.78rem', color: 'var(--ink-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {topic.name}
                    </span>
                    <div style={{ flex: 1, height: 20, background: 'var(--bg-card)', borderRadius: 4, overflow: 'hidden', border: '0.5px solid var(--border)' }}>
                      <div style={{
                        height: '100%',
                        width: `${(topic.count / maxCount) * 100}%`,
                        background: 'var(--accent)',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                        minWidth: 4,
                      }} />
                    </div>
                    <span style={{ width: 24, fontSize: '0.72rem', color: 'var(--ink-faint)', textAlign: 'right' }}>
                      {topic.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Evolution tab */}
        {tab === 'evolution' && (
          <>
            {notes.length < 2 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)' }}>
                You need at least 2 notes to track knowledge evolution.
              </p>
            ) : isLoadingEvolution ? (
              <LoadingSpinner label="Tracing your intellectual journey..." />
            ) : concepts.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)' }}>
                No evolving concepts found. Try writing about the same topics across multiple notes.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {concepts.map((concept) => {
                  const isExpanded = expandedConcept === concept.name
                  return (
                    <div
                      key={concept.name}
                      style={{
                        borderRadius: 'var(--radius)',
                        border: `0.5px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`,
                        background: 'var(--bg-card)',
                        overflow: 'hidden',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <button
                        onClick={() => setExpandedConcept(isExpanded ? null : concept.name)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div>
                          <div style={{
                            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                            fontSize: '1rem',
                            color: 'var(--ink)',
                            marginBottom: '0.2rem',
                          }}>
                            {concept.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                            {concept.summary}
                          </div>
                        </div>
                        <span style={{
                          color: 'var(--ink-faint)',
                          fontSize: '0.9rem',
                          transform: isExpanded ? 'rotate(180deg)' : '',
                          transition: 'transform 0.2s',
                          flexShrink: 0,
                          marginLeft: '1rem',
                        }}>
                          ▾
                        </span>
                      </button>

                      {isExpanded && (
                        <div style={{ padding: '0 1.25rem 1.25rem', paddingLeft: '2rem' }}>
                          {/* Vertical timeline line */}
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              position: 'absolute',
                              left: '4px',
                              top: 0,
                              bottom: 0,
                              width: '1px',
                              background: 'var(--border-strong)',
                            }} />

                            {concept.timeline.map((entry, i) => {
                              const color = CHANGE_COLORS[entry.change] || 'var(--ink-faint)'
                              const d = new Date(entry.date)
                              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              return (
                                <div key={i} style={{ position: 'relative', paddingLeft: '1.5rem', paddingBottom: i < concept.timeline.length - 1 ? '1rem' : 0 }}>
                                  {/* Dot */}
                                  <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '0.25rem',
                                    width: 9,
                                    height: 9,
                                    borderRadius: '50%',
                                    background: color,
                                    border: `2px solid var(--bg-card)`,
                                    boxShadow: `0 0 0 1px ${color}`,
                                  }} />

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>{dateStr}</span>
                                    <span style={{
                                      fontSize: '0.62rem',
                                      fontWeight: 600,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.08em',
                                      color,
                                      background: `${color}18`,
                                      padding: '0.1rem 0.4rem',
                                      borderRadius: 100,
                                    }}>
                                      {entry.change}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: 500, marginBottom: '0.1rem' }}>
                                    {entry.noteTitle}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                                    {entry.understanding}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Legend */}
            {!isLoadingEvolution && concepts.length > 0 && (
              <div style={{
                marginTop: '2rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border)',
              }}>
                {Object.entries(CHANGE_COLORS).map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'capitalize' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem 0', justifyContent: 'center' }}>
      <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'var(--accent)', fill: 'none', strokeWidth: 2, animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>{label}</span>
    </div>
  )
}
