'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useNotes } from '@/lib/NotesContext'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { computePersonalStats, initialsFor } from '@/lib/personalStats'

/**
 * Tiny clickable identity tile in the sidebar header.
 * Doubles as a link to /app/settings and the writing-streak indicator.
 */
export default function Avatar() {
  const { userName, workspaceType } = useWorkspace()
  const { notes } = useNotes()
  const stats = useMemo(() => computePersonalStats(notes), [notes])

  const initials = initialsFor(userName || '')
  const streak = stats.streakDays
  const showStreakRing = streak >= 2

  return (
    <Link
      href="/app/settings"
      title={
        userName
          ? `${userName} · ${streak > 0 ? `${streak}-day streak` : 'Settings'}`
          : 'Settings'
      }
      style={{
        position: 'relative',
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'var(--accent-light)',
        border: `1px solid ${showStreakRing ? 'var(--accent)' : 'var(--border-strong)'}`,
        boxShadow: showStreakRing ? '0 0 14px var(--accent-glow)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent)',
        fontFamily: 'var(--font-instrument-serif), Georgia, serif',
        fontSize: '1rem',
        fontWeight: 500,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.18s',
        flexShrink: 0,
        letterSpacing: '0.01em',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.06)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'none'
      }}
      data-workspace={workspaceType ?? 'student'}
    >
      {initials}
      {streak >= 2 && (
        <span
          style={{
            position: 'absolute',
            bottom: -4,
            right: -6,
            background: 'var(--accent)',
            color: '#0E0E0C',
            fontSize: '0.62rem',
            fontWeight: 700,
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            padding: '0.05rem 0.32rem',
            borderRadius: 99,
            border: '2px solid var(--bg)',
            lineHeight: 1.2,
            letterSpacing: '0.02em',
            minWidth: 18,
            textAlign: 'center',
          }}
        >
          {streak}d
        </span>
      )}
    </Link>
  )
}
