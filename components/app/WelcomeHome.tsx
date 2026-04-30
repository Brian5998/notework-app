'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useNotes } from '@/lib/NotesContext'
import { useLinks, makeContradictionKey } from '@/lib/LinksContext'
import { useWorkspace } from '@/lib/WorkspaceContext'
import {
  computePersonalStats,
  adaptiveNoticeLine,
} from '@/lib/personalStats'

type Props = {
  onNew: (id: string) => void
  onSelect: (id: string) => void
  onOpenQuiz: () => void
  onOpenInsights: () => void
}

type NextAction =
  | { kind: 'first-note' }
  | { kind: 'resolve-contradictions'; count: number }
  | { kind: 'unlock-forest'; remaining: number }
  | { kind: 'pick-up-where-left-off'; noteId: string; title: string; daysSince: number }
  | { kind: 'add-more-notes' }
  | { kind: 'review-cluster'; conceptTitle: string; noteId: string }

export default function WelcomeHome({
  onNew,
  onSelect,
  onOpenQuiz,
  onOpenInsights,
}: Props) {
  const { notes, addNote } = useNotes()
  const {
    confirmedLinks,
    detectedContradictions,
    isContradictionDismissed,
  } = useLinks()
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

  const unresolvedContradictions = useMemo(
    () =>
      detectedContradictions.filter(
        (c) =>
          !isContradictionDismissed(makeContradictionKey(c.noteIds, c.explanation)),
      ),
    [detectedContradictions, isContradictionDismissed],
  )

  const mostRecent = useMemo(() => {
    if (notes.length === 0) return null
    return [...notes].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )[0]
  }, [notes])

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
      .slice(0, 4)
  }, [notes, confirmedLinks])

  const forestUnlocked = confirmedLinks.length >= 3
  const displayName = userName || 'friend'

  const stats = useMemo(() => computePersonalStats(notes), [notes])
  const personalNotice = useMemo(
    () =>
      adaptiveNoticeLine(
        stats,
        unresolvedContradictions.length,
        forestUnlocked,
      ),
    [stats, unresolvedContradictions.length, forestUnlocked],
  )

  // Compute the single "next best action" — the heart of the dashboard
  const nextAction: NextAction = useMemo(() => {
    if (notes.length === 0) return { kind: 'first-note' }
    if (unresolvedContradictions.length > 0) {
      return {
        kind: 'resolve-contradictions',
        count: unresolvedContradictions.length,
      }
    }
    if (mostRecent) {
      const days = Math.floor(
        (Date.now() - new Date(mostRecent.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
      // Recently edited (< 4 days) → pick up where you left off
      if (days <= 4) {
        return {
          kind: 'pick-up-where-left-off',
          noteId: mostRecent.id,
          title: mostRecent.title || 'Untitled',
          daysSince: days,
        }
      }
    }
    if (!forestUnlocked) {
      return { kind: 'unlock-forest', remaining: 3 - confirmedLinks.length }
    }
    if (revisitedTop.length > 0) {
      return {
        kind: 'review-cluster',
        conceptTitle: revisitedTop[0].note.title || 'Untitled',
        noteId: revisitedTop[0].note.id,
      }
    }
    return { kind: 'add-more-notes' }
  }, [
    notes.length,
    unresolvedContradictions.length,
    forestUnlocked,
    confirmedLinks.length,
    mostRecent,
    revisitedTop,
  ])

  function handleNewNote() {
    const note = addNote('Untitled', '')
    onNew(note.id)
  }

  function handleNextActionClick() {
    switch (nextAction.kind) {
      case 'first-note':
      case 'add-more-notes':
        handleNewNote()
        break
      case 'pick-up-where-left-off':
      case 'review-cluster':
        onSelect(nextAction.noteId)
        break
      case 'resolve-contradictions':
      case 'unlock-forest':
        // navigation handled by Link in render
        break
    }
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
        {/* Date */}
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

        {/* Greeting */}
        <h1
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 'clamp(2.6rem, 5.5vw, 4rem)',
            fontWeight: 400,
            color: 'var(--ink)',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            marginBottom: '0.85rem',
          }}
        >
          {greeting},{' '}
          <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>
            {displayName}
          </span>
        </h1>

        {/* Status line — embodies the "personal assistant" vibe */}
        <p
          style={{
            fontSize: '1.3rem',
            color: 'var(--ink-muted)',
            lineHeight: 1.5,
            marginBottom: personalNotice ? '1.25rem' : '2.25rem',
            maxWidth: 720,
          }}
        >
          {summaryLine({
            notes: notes.length,
            links: confirmedLinks.length,
            contradictions: unresolvedContradictions.length,
          })}
        </p>

        {/* Adaptive "I noticed" banner — only renders when we have something
            personal worth pointing out */}
        {personalNotice && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.75rem 1.1rem',
              background: 'var(--bg-elevated)',
              borderTop: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: 12,
              color: 'var(--ink)',
              fontSize: '0.98rem',
              lineHeight: 1.5,
              maxWidth: 720,
              marginBottom: '2rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontStyle: 'italic',
                color: 'var(--accent)',
                fontSize: '1.05rem',
              }}
            >
              I noticed —
            </span>
            <span style={{ flex: 1 }}>{personalNotice}</span>
          </div>
        )}

        {/* Hero next-best-action card */}
        <NextActionHero
          action={nextAction}
          onClick={handleNextActionClick}
        />

        {/* Secondary feature grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
            marginBottom: '2.5rem',
          }}
        >
          <SecondaryCard onClick={handleNewNote} icon={<PencilIcon />} title="New note" />
          {forestUnlocked ? (
            <SecondaryLink href="/app/forest" icon={<ForestIcon />} title="Forest map" />
          ) : (
            <SecondaryCard
              icon={<ForestIcon />}
              title="Forest map"
              disabled
              hint={`${3 - confirmedLinks.length} more link${3 - confirmedLinks.length === 1 ? '' : 's'}`}
            />
          )}
          <SecondaryLink
            href="/app/conflicts"
            icon={<ConflictIcon />}
            title="Conflicts"
            badge={unresolvedContradictions.length > 0 ? unresolvedContradictions.length : undefined}
            badgeColor="#ef4444"
          />
          {showQuiz && (
            <SecondaryCard
              onClick={onOpenQuiz}
              icon={<QuizIcon />}
              title="Quiz me"
              disabled={notes.length < 2}
            />
          )}
          <SecondaryCard
            onClick={onOpenInsights}
            icon={<ChartIcon />}
            title="Insights"
            disabled={notes.length < 3}
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
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
                    fontFamily: 'inherit',
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
          <span>
            {notes.length} note{notes.length === 1 ? '' : 's'} ·{' '}
            {confirmedLinks.length} link{confirmedLinks.length === 1 ? '' : 's'} ·{' '}
            {unresolvedContradictions.length} conflict
            {unresolvedContradictions.length === 1 ? '' : 's'}
            {stats.streakDays >= 2 && (
              <>
                {' · '}
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {stats.streakDays}-day streak
                </span>
              </>
            )}
            {stats.notesThisWeek > 0 && (
              <>
                {' · '}
                {stats.notesThisWeek} this week
              </>
            )}
          </span>
          <span>
            Press <Kbd>⌘K</Kbd> for the command palette
          </span>
        </div>
      </div>
    </div>
  )
}

function summaryLine({
  notes,
  links,
  contradictions,
}: {
  notes: number
  links: number
  contradictions: number
}) {
  if (notes === 0)
    return "Let's get your first note in. The product gets sharper with every entry."
  if (contradictions > 0)
    return `Heads up — I caught ${contradictions} contradiction${contradictions === 1 ? '' : 's'} in your notes. Worth a look before they bite you on an exam.`
  if (links < 3)
    return `Almost there. ${3 - links} more confirmed link${3 - links === 1 ? '' : 's'} unlocks your Forest map.`
  return `Looking sharp — ${notes} note${notes === 1 ? '' : 's'}, ${links} confirmed link${links === 1 ? '' : 's'}, no contradictions. Here's what I'd do next.`
}

function NextActionHero({
  action,
  onClick,
}: {
  action: NextAction
  onClick: () => void
}) {
  const config = configForAction(action)
  const wrapperStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '1.85rem 2rem',
    borderRadius: 22,
    background: config.background,
    border: `1px solid ${config.borderColor}`,
    boxShadow: config.shadow,
    cursor: 'pointer',
    color: 'inherit',
    textDecoration: 'none',
    fontFamily: 'inherit',
    transition: 'transform 0.18s ease, box-shadow 0.2s ease, border-color 0.18s',
    marginBottom: '2rem',
  }

  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: config.iconBg,
          color: config.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {config.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: config.eyebrowColor,
            marginBottom: '0.4rem',
          }}
        >
          Next best step
        </div>
        <div
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 'clamp(1.5rem, 3vw, 2.05rem)',
            color: config.titleColor,
            lineHeight: 1.15,
            letterSpacing: '-0.015em',
            marginBottom: '0.4rem',
          }}
        >
          {config.title}
        </div>
        <div
          style={{
            fontSize: '1.05rem',
            color: config.descColor,
            lineHeight: 1.55,
          }}
        >
          {config.desc}
        </div>
      </div>
      <div
        style={{
          fontSize: '1.4rem',
          color: config.titleColor,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        →
      </div>
    </div>
  )

  if (config.href) {
    return (
      <Link
        href={config.href}
        style={wrapperStyle}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = config.hoverShadow
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.transform = 'none'
          el.style.boxShadow = config.shadow
        }}
      >
        {inner}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      style={wrapperStyle}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = config.hoverShadow
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.transform = 'none'
        el.style.boxShadow = config.shadow
      }}
    >
      {inner}
    </button>
  )
}

function configForAction(action: NextAction) {
  switch (action.kind) {
    case 'resolve-contradictions':
      return {
        title: `Resolve ${action.count} contradiction${action.count === 1 ? '' : 's'} in your notes`,
        desc: 'I caught them while you were away. Resolving these is the cheapest GPA insurance you can buy.',
        icon: <ConflictIconLarge />,
        iconBg: 'rgba(239,68,68,0.14)',
        iconColor: '#ef4444',
        background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.04) 100%)',
        borderColor: 'rgba(239,68,68,0.4)',
        eyebrowColor: '#ef4444',
        titleColor: 'var(--ink)',
        descColor: 'var(--ink-muted)',
        shadow: '0 8px 28px rgba(239,68,68,0.18)',
        hoverShadow: '0 16px 40px rgba(239,68,68,0.28)',
        href: '/app/conflicts' as const,
      }
    case 'first-note':
      return {
        title: 'Write your first note',
        desc: "We've pre-loaded a few example notes so you can play. Try writing one of your own.",
        icon: <PencilIconLarge />,
        iconBg: 'rgba(14,14,12,0.18)',
        iconColor: '#0E0E0C',
        background: 'var(--accent)',
        borderColor: 'var(--accent-mid)',
        eyebrowColor: 'rgba(14,14,12,0.65)',
        titleColor: '#0E0E0C',
        descColor: 'rgba(14,14,12,0.7)',
        shadow: '0 12px 32px var(--accent-glow)',
        hoverShadow: '0 18px 48px var(--accent-glow)',
        href: undefined,
      }
    case 'pick-up-where-left-off':
      return {
        title: `Pick up where you left off — "${truncate(action.title, 48)}"`,
        desc:
          action.daysSince === 0
            ? 'Edited earlier today. Keep the momentum.'
            : `Edited ${action.daysSince} day${action.daysSince === 1 ? '' : 's'} ago. Re-reading is the highest-leverage thing you can do right now.`,
        icon: <ClockIconLarge />,
        iconBg: 'var(--bg-elevated-2)',
        iconColor: 'var(--accent)',
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-strong)',
        eyebrowColor: 'var(--ink-faint)',
        titleColor: 'var(--ink)',
        descColor: 'var(--ink-muted)',
        shadow: '0 4px 14px rgba(0,0,0,0.18)',
        hoverShadow: '0 14px 36px rgba(0,0,0,0.32)',
        href: undefined,
      }
    case 'unlock-forest':
      return {
        title: `Confirm ${action.remaining} more link${action.remaining === 1 ? '' : 's'} to unlock your Forest`,
        desc: 'The Forest is the moment Notework starts to feel like infrastructure instead of a notes app.',
        icon: <ForestIconLarge />,
        iconBg: 'var(--bg-elevated-2)',
        iconColor: 'var(--accent)',
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-strong)',
        eyebrowColor: 'var(--ink-faint)',
        titleColor: 'var(--ink)',
        descColor: 'var(--ink-muted)',
        shadow: '0 4px 14px rgba(0,0,0,0.18)',
        hoverShadow: '0 14px 36px rgba(0,0,0,0.32)',
        href: undefined,
      }
    case 'review-cluster':
      return {
        title: `Review your top concept — "${truncate(action.conceptTitle, 48)}"`,
        desc: "It's the one you've connected to the most. A 5-minute re-read is the highest-ROI thing on this dashboard.",
        icon: <ReviewIconLarge />,
        iconBg: 'var(--bg-elevated-2)',
        iconColor: 'var(--accent)',
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-strong)',
        eyebrowColor: 'var(--ink-faint)',
        titleColor: 'var(--ink)',
        descColor: 'var(--ink-muted)',
        shadow: '0 4px 14px rgba(0,0,0,0.18)',
        hoverShadow: '0 14px 36px rgba(0,0,0,0.32)',
        href: undefined,
      }
    case 'add-more-notes':
    default:
      return {
        title: 'Capture something new',
        desc: 'You\u2019re in good shape — add a fresh note and watch the graph grow.',
        icon: <PencilIconLarge />,
        iconBg: 'rgba(14,14,12,0.18)',
        iconColor: '#0E0E0C',
        background: 'var(--accent)',
        borderColor: 'var(--accent-mid)',
        eyebrowColor: 'rgba(14,14,12,0.65)',
        titleColor: '#0E0E0C',
        descColor: 'rgba(14,14,12,0.7)',
        shadow: '0 12px 32px var(--accent-glow)',
        hoverShadow: '0 18px 48px var(--accent-glow)',
        href: undefined,
      }
  }
}

function SecondaryCard({
  onClick,
  icon,
  title,
  disabled,
  hint,
}: {
  onClick?: () => void
  icon: React.ReactNode
  title: string
  disabled?: boolean
  hint?: string
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={secondaryStyle(disabled)}
      onMouseEnter={(e) => {
        if (disabled) return
        const el = e.currentTarget as HTMLButtonElement
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = 'var(--accent-mid)'
        el.style.boxShadow = '0 10px 24px rgba(0,0,0,0.28)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.transform = 'none'
        el.style.borderColor = 'var(--border-strong)'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>{icon}</div>
      <span
        style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </span>
      {hint && (
        <span
          style={{
            fontSize: '0.82rem',
            color: 'var(--ink-faint)',
            marginLeft: 'auto',
          }}
        >
          {hint}
        </span>
      )}
    </button>
  )
}

function SecondaryLink({
  href,
  icon,
  title,
  badge,
  badgeColor,
}: {
  href: string
  icon: React.ReactNode
  title: string
  badge?: number
  badgeColor?: string
}) {
  return (
    <Link
      href={href}
      style={{ ...secondaryStyle(false), textDecoration: 'none' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = 'var(--accent-mid)'
        el.style.boxShadow = '0 10px 24px rgba(0,0,0,0.28)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.transform = 'none'
        el.style.borderColor = 'var(--border-strong)'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>{icon}</div>
      <span
        style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </span>
      {badge !== undefined && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#fff',
            background: badgeColor ?? 'var(--accent)',
            padding: '0.18rem 0.55rem',
            borderRadius: 99,
            minWidth: 22,
            textAlign: 'center',
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

function secondaryStyle(disabled?: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '1.1rem 1.2rem',
    borderRadius: 14,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s',
    color: 'inherit',
    fontFamily: 'inherit',
    width: '100%',
    textAlign: 'left',
    minHeight: 72,
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

// ── Icons ───────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function PencilIconLarge() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function ForestIconLarge() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function ConflictIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ConflictIconLarge() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ClockIconLarge() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  )
}

function ReviewIconLarge() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
