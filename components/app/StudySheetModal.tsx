'use client'

import { useEffect, useState } from 'react'
import { Note } from '@/lib/types'
import { useToast } from './Toast'

type Section = { heading: string; bullets: string[] }
type KeyTerm = { term: string; definition: string }
type Citation = { index: number; id: string; title: string }

type Sheet = {
  headline: string
  tldr: string
  sections: Section[]
  key_terms: KeyTerm[]
  open_questions: string[]
  citations: Citation[]
}

type Props = {
  topic: string
  notes: Note[]
  onClose: () => void
  onSelectNote?: (id: string) => void
}

export default function StudySheetModal({
  topic,
  notes,
  onClose,
  onSelectNote,
}: Props) {
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    ;(async () => {
      try {
        const res = await fetch('/api/study-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, notes }),
        })
        const data = (await res.json()) as Sheet
        if (cancelled) return
        if (!data.sections || data.sections.length === 0) {
          setError(true)
        } else {
          setSheet(data)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [topic, notes])

  // Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function copyToClipboard() {
    if (!sheet) return
    const md = sheetToMarkdown(sheet, topic)
    navigator.clipboard.writeText(md).then(
      () => showToast('Copied to clipboard.', { variant: 'success' }),
      () => showToast('Could not copy.', { variant: 'warn' }),
    )
  }

  function downloadMarkdown() {
    if (!sheet) return
    const md = sheetToMarkdown(sheet, topic)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slugify(sheet.headline || topic)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border-strong)',
          borderRadius: 22,
          width: '100%',
          maxWidth: 740,
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'var(--ink)',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          boxShadow: '0 28px 80px rgba(0,0,0,0.55)',
          animation: 'cmdPaletteIn 0.22s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            zIndex: 5,
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: '0.35rem',
              }}
            >
              Study sheet
            </div>
            <div
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontSize: '1.85rem',
                fontWeight: 400,
                color: 'var(--ink)',
                letterSpacing: '-0.018em',
                lineHeight: 1.15,
              }}
            >
              {sheet?.headline || topic}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-faint)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0.25rem',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <SkeletonLine width="92%" />
              <SkeletonLine width="78%" />
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <SkeletonLine width="38%" />
                  <SkeletonLine width="88%" />
                  <SkeletonLine width="76%" />
                  <SkeletonLine width="82%" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: '1.25rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--ink-muted)',
                fontSize: '1rem',
                lineHeight: 1.55,
              }}
            >
              Couldn&apos;t generate a sheet for this cluster. Try again, or pick a
              cluster with a few more notes.
            </div>
          )}

          {sheet && !loading && (
            <>
              {sheet.tldr && (
                <p
                  style={{
                    fontSize: '1.1rem',
                    lineHeight: 1.65,
                    color: 'var(--ink)',
                    margin: '0 0 1.85rem',
                    paddingLeft: '0.95rem',
                    borderLeft: '3px solid var(--accent)',
                  }}
                >
                  {sheet.tldr}
                </p>
              )}

              {sheet.sections.map((section, i) => (
                <div key={i} style={{ marginBottom: '1.5rem' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                      fontSize: '1.3rem',
                      color: 'var(--ink)',
                      margin: '0 0 0.6rem',
                      letterSpacing: '-0.01em',
                      fontWeight: 400,
                    }}
                  >
                    {section.heading}
                  </h3>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      color: 'var(--ink)',
                      fontSize: '1rem',
                      lineHeight: 1.65,
                    }}
                  >
                    {section.bullets.map((b, j) => (
                      <li key={j} style={{ marginBottom: '0.4rem' }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {sheet.key_terms.length > 0 && (
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '1.25rem 1.4rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-faint)',
                      marginBottom: '0.85rem',
                    }}
                  >
                    Key terms
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {sheet.key_terms.map((kt, i) => (
                      <div key={i}>
                        <span
                          style={{
                            color: 'var(--accent)',
                            fontWeight: 600,
                            marginRight: '0.5rem',
                          }}
                        >
                          {kt.term}
                        </span>
                        <span style={{ color: 'var(--ink-muted)', fontSize: '0.95rem' }}>
                          {kt.definition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sheet.open_questions.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--accent)',
                      marginBottom: '0.6rem',
                    }}
                  >
                    Open questions
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      color: 'var(--ink)',
                      fontSize: '0.98rem',
                      lineHeight: 1.65,
                    }}
                  >
                    {sheet.open_questions.map((q, i) => (
                      <li key={i} style={{ marginBottom: '0.35rem' }}>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sheet.citations.length > 0 && (
                <div
                  style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                    fontSize: '0.85rem',
                    color: 'var(--ink-faint)',
                  }}
                >
                  Built from your notes:{' '}
                  {sheet.citations.map((c, i) => (
                    <span key={c.id}>
                      <button
                        onClick={() => onSelectNote?.(c.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.85rem',
                          padding: 0,
                        }}
                      >
                        [{c.index}] {c.title}
                      </button>
                      {i < sheet.citations.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {sheet && !loading && (
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              background: 'var(--bg)',
              borderTop: '1px solid var(--border)',
              padding: '1rem 1.75rem',
              display: 'flex',
              gap: '0.6rem',
              justifyContent: 'flex-end',
            }}
          >
            <button onClick={copyToClipboard} style={ghostBtn}>
              Copy as markdown
            </button>
            <button onClick={downloadMarkdown} style={accentBtn}>
              Download .md
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <div
      style={{
        height: 12,
        width,
        background: 'var(--border)',
        borderRadius: 4,
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--ink-muted)',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  padding: '0.55rem 1.1rem',
  fontSize: '0.92rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const accentBtn: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#0E0E0C',
  border: 'none',
  borderRadius: 8,
  padding: '0.55rem 1.1rem',
  fontSize: '0.92rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '0.02em',
}

function sheetToMarkdown(sheet: Sheet, fallbackTopic: string) {
  const lines: string[] = []
  lines.push(`# ${sheet.headline || fallbackTopic}`)
  lines.push('')
  if (sheet.tldr) {
    lines.push(`> ${sheet.tldr}`)
    lines.push('')
  }
  for (const section of sheet.sections) {
    lines.push(`## ${section.heading}`)
    for (const b of section.bullets) lines.push(`- ${b}`)
    lines.push('')
  }
  if (sheet.key_terms.length) {
    lines.push('## Key terms')
    for (const kt of sheet.key_terms)
      lines.push(`- **${kt.term}** — ${kt.definition}`)
    lines.push('')
  }
  if (sheet.open_questions.length) {
    lines.push('## Open questions')
    for (const q of sheet.open_questions) lines.push(`- ${q}`)
    lines.push('')
  }
  if (sheet.citations.length) {
    lines.push('---')
    lines.push('Built from:')
    for (const c of sheet.citations) lines.push(`- [${c.index}] ${c.title}`)
  }
  return lines.join('\n')
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
