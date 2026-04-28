'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useNotes } from '@/lib/NotesContext'
import { useLinks } from '@/lib/LinksContext'
import { useWorkspace } from '@/lib/WorkspaceContext'

type Props = {
  onNew: (id: string) => void
  onSelect: (id: string) => void
  onOpenQuiz: () => void
  onOpenInsights: () => void
}

export default function WelcomeHome({
  onNew,
  onSelect,
  onOpenQuiz,
  onOpenInsights,
}: Props) {
  const { notes, addNote } = useNotes()
  const { confirmedLinks } = useLinks()
  const { userName, showQuiz } = useWorkspace()

  const greeting = useMemo(() => getGreeting(), [])
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [],
  )

  // Most recently edited note (using createdAt as the proxy)
  const mostRecent = useMemo(() => {
    if (notes.length === 0) return null
    return [...notes].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )[0]
  }, [notes])

  // "Most revisited" — heuristic: notes with the highest number of confirmed
  // links count as the concepts you've returned to most.
  const revisitedTop = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of confirmedLinks) {
      counts[l.sourceNoteId] = (counts[l.sourceNoteId] ?? 0) + 1
      counts[l.targetNoteId] = (counts[l.targetNoteId] ?? 0) + 1
    }
    return notes
      .map((n) => ({ note: n, count: counts[n.id] ?? 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }, [notes, confirmedLinks])

  const forestUnlocked = confirmedLinks.length >= 3
  const displayName = userName || 'friend'

  function handleNewNote() {
    const note = addNote('Untitled', '')
    onNew(note.id)
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4rem 3rem 5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 920 }}>
        {/* Date + greeting */}
        <div
          style={{
            fontSize: '0.95rem',
            color: 'var(--ink-faint)',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
          }}
        >
          {dateLabel}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 'clamp(2.6rem, 5.5vw, 4rem)',
            fontWeight: 400,
            color: 'var(--ink)',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            marginBottom: '1rem',
          }}
        >
          {greeting},{' '}
          <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>
            {displayName}
          </span>
        </h1>
        <p
          style={{
            fontSize: '1.4rem',
            color: 'var(--ink-muted)',
            lineHeight: 1.5,
            marginBottom: '3rem',
            maxWidth: 640,
          }}
        >
          Here&apos;s what you can study today.
        </p>

        {/* Feature grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            marginBottom: '3rem',
          }}
        >
          <FeatureCard
            onClick={handleNewNote}
            icon={<PencilIcon />}
            title="New note"
            desc="Start writing — capture an idea or class material."
            primary
          />
          {forestUnlocked ? (
            <LinkFeatureCard
              href="/app/forest"
              icon={<ForestIcon />}
              title="Forest map"
              desc={`Explore ${confirmedLinks.length} confirmed links across your knowledge.`}
            />
          ) : (
            <FeatureCard
              icon={<ForestIcon />}
              title="Forest map"
              desc={`Confirm ${3 - confirmedLinks.length} more connection${3 - confirmedLinks.length === 1 ? '' : 's'} to unlock.`}
              disabled
            />
          )}
          {showQuiz && (
            <FeatureCard
              onClick={onOpenQuiz}
              icon={<QuizIcon />}
              title="Quiz yourself"
              desc="Generate a practice quiz from your notes — prep for an exam."
              disabled={notes.length < 2}
              disabledMessage="Add at least 2 notes."
            />
          )}
          {mostRecent ? (
            <FeatureCard
              onClick={() => onSelect(mostRecent.id)}
              icon={<ClockIcon />}
              title="Pick up where you left off"
              desc={truncate(mostRecent.title || 'Untitled', 60)}
            />
          ) : (
            <FeatureCard
              icon={<ClockIcon />}
              title="Recent activity"
              desc="Your most recently edited note will appear here."
              disabled
            />
          )}
          <FeatureCard
            onClick={onOpenInsights}
            icon={<ChartIcon />}
            title="Your insights"
            desc="See themes, gaps, and most-revisited concepts."
            disabled={notes.length < 3}
            disabledMessage="Add at least 3 notes."
          />
        </div>

        {/* Most revisited concepts */}
        {revisitedTop.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
                marginBottom: '1rem',
              }}
            >
              Most revisited concepts
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.6rem',
              }}
            >
              {revisitedTop.map(({ note, count }) => (
                <button
                  key={note.id}
                  onClick={() => onSelect(note.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 1.1rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 99,
                    color: 'var(--ink)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                      'var(--accent-mid)'
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      'var(--bg-elevated-2)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                      'var(--border)'
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      'var(--bg-elevated)'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    ×{count}
                  </span>
                  {truncate(note.title || 'Untitled', 36)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            fontSize: '0.95rem',
            color: 'var(--ink-faint)',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>{notes.length} note{notes.length === 1 ? '' : 's'} · {confirmedLinks.length} confirmed link{confirmedLinks.length === 1 ? '' : 's'}</span>
          <span>
            Press <Kbd>⌘K</Kbd> for the command palette
          </span>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  onClick,
  icon,
  title,
  desc,
  primary,
  disabled,
  disabledMessage,
}: {
  onClick?: () => void
  icon: React.ReactNode
  title: string
  desc: string
  primary?: boolean
  disabled?: boolean
  disabledMessage?: string
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={cardStyle(primary, disabled)}
      onMouseEnter={(e) => {
        if (disabled) return
        const el = e.currentTarget as HTMLButtonElement
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = primary ? 'var(--accent)' : 'var(--accent-mid)'
        el.style.boxShadow = primary
          ? '0 14px 32px var(--accent-glow)'
          : '0 12px 28px rgba(0,0,0,0.32)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.transform = 'none'
        el.style.borderColor = primary
          ? 'var(--accent-mid)'
          : 'var(--border-strong)'
        el.style.boxShadow = primary
          ? '0 8px 24px var(--accent-glow)'
          : '0 2px 8px rgba(0,0,0,0.18)'
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: primary ? 'rgba(0,0,0,0.18)' : 'var(--bg-elevated-2)',
          color: primary ? '#0E0E0C' : 'var(--accent)',
          marginBottom: '0.85rem',
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: '1.2rem',
          fontWeight: 600,
          color: primary ? '#0E0E0C' : 'var(--ink)',
          marginBottom: '0.35rem',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '0.98rem',
          color: primary ? 'rgba(14,14,12,0.7)' : 'var(--ink-muted)',
          lineHeight: 1.5,
        }}
      >
        {disabled && disabledMessage ? disabledMessage : desc}
      </div>
    </button>
  )
}

function LinkFeatureCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      style={{
        ...cardStyle(false, false),
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = 'var(--accent-mid)'
        el.style.boxShadow = '0 12px 28px rgba(0,0,0,0.32)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.transform = 'none'
        el.style.borderColor = 'var(--border-strong)'
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)'
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-elevated-2)',
          color: 'var(--accent)',
          marginBottom: '0.85rem',
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: '1.2rem',
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: '0.35rem',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '0.98rem',
          color: 'var(--ink-muted)',
          lineHeight: 1.5,
        }}
      >
        {desc}
      </div>
    </Link>
  )
}

function cardStyle(primary?: boolean, disabled?: boolean): React.CSSProperties {
  return {
    textAlign: 'left',
    padding: '1.5rem 1.6rem',
    borderRadius: 18,
    background: primary ? 'var(--accent)' : 'var(--bg-elevated)',
    border: `1px solid ${primary ? 'var(--accent-mid)' : 'var(--border-strong)'}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.2s ease, background 0.18s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minHeight: 168,
    boxShadow: primary
      ? '0 8px 24px var(--accent-glow)'
      : '0 2px 8px rgba(0,0,0,0.18)',
    color: 'inherit',
    fontFamily: 'inherit',
    width: '100%',
  }
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        display: 'inline-block',
        padding: '0.1rem 0.45rem',
        borderRadius: 6,
        background: 'var(--bg-elevated-2)',
        border: '1px solid var(--border)',
        fontSize: '0.85rem',
        fontFamily: 'inherit',
        color: 'var(--ink-muted)',
      }}
    >
      {children}
    </kbd>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Burning the midnight oil'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Late night studying'
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function ForestIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="14" r="2.5" />
      <circle cx="6" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <line x1="7.4" y1="7.4" x2="10.6" y2="12.6" />
      <line x1="16.6" y1="7.4" x2="13.4" y2="12.6" />
      <line x1="11" y1="15.5" x2="7" y2="19" />
      <line x1="13" y1="15.5" x2="17" y2="19" />
    </svg>
  )
}

function QuizIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
