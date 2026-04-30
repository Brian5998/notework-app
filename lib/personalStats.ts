import { Note } from './types'

/**
 * Local-first personal stats. Everything is derived from notes that already
 * live in localStorage — no extra storage, no analytics endpoint.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export type PersonalStats = {
  /** Consecutive days (ending today) with at least 1 note edited / created. */
  streakDays: number
  /** Notes created in the last 7 days. */
  notesThisWeek: number
  /** Most active hour (0-23) over the last 30 days, or null if too little data. */
  preferredHour: number | null
  /** Total notes. */
  totalNotes: number
  /** Whether the user is "active right now" — created/edited a note today. */
  activeToday: boolean
  /** Most recently created note. */
  lastNote: Note | null
}

export function computePersonalStats(notes: Note[]): PersonalStats {
  const now = new Date()
  const today = startOfDay(now).getTime()
  const weekAgo = today - 7 * DAY_MS

  const notesThisWeek = notes.filter(
    (n) => new Date(n.createdAt).getTime() >= weekAgo,
  ).length

  // Day-set: which days (yyyy-mm-dd) have at least one note?
  const days = new Set<number>()
  for (const n of notes) {
    days.add(startOfDay(new Date(n.createdAt)).getTime())
  }
  let streak = 0
  let cursor = today
  // Allow today to count as "streak active" only if a note exists today;
  // otherwise count starting from yesterday so a brief idle morning doesn't
  // wipe a streak.
  const activeToday = days.has(today)
  if (!activeToday) cursor -= DAY_MS
  while (days.has(cursor)) {
    streak++
    cursor -= DAY_MS
  }

  // Preferred hour: histogram of note-creation hours over last 30 days
  const hourCounts: Record<number, number> = {}
  const monthAgo = today - 30 * DAY_MS
  for (const n of notes) {
    const t = new Date(n.createdAt).getTime()
    if (t < monthAgo) continue
    const h = new Date(n.createdAt).getHours()
    hourCounts[h] = (hourCounts[h] ?? 0) + 1
  }
  const hourEntries = Object.entries(hourCounts)
  const preferredHour =
    hourEntries.length >= 3
      ? Number(
          hourEntries.sort((a, b) => b[1] - a[1])[0][0],
        )
      : null

  const lastNote = notes.length
    ? [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    : null

  return {
    streakDays: streak,
    notesThisWeek,
    preferredHour,
    totalNotes: notes.length,
    activeToday,
    lastNote,
  }
}

function startOfDay(d: Date) {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

/** Initials from a user's full name; falls back to first char or "?" */
export function initialsFor(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Adaptive "I noticed…" line for the welcome dashboard */
export function adaptiveNoticeLine(
  stats: PersonalStats,
  unresolvedContradictions: number,
  forestUnlocked: boolean,
): string | null {
  if (unresolvedContradictions > 0) {
    return `I caught ${unresolvedContradictions} contradiction${unresolvedContradictions === 1 ? '' : 's'} in your notes since you were last here. Worth a look.`
  }
  if (stats.totalNotes === 0) {
    return null
  }
  if (stats.streakDays >= 7) {
    return `${stats.streakDays}-day writing streak. You're building something real.`
  }
  if (stats.streakDays >= 3) {
    return `${stats.streakDays} days in a row — momentum's real.`
  }
  if (stats.notesThisWeek >= 5) {
    return `${stats.notesThisWeek} notes this week. The graph is getting denser.`
  }
  if (stats.preferredHour !== null) {
    const now = new Date().getHours()
    const diff = Math.min(
      Math.abs(now - stats.preferredHour),
      24 - Math.abs(now - stats.preferredHour),
    )
    if (diff <= 1)
      return 'You usually study around now. Pick up where you left off?'
  }
  if (!forestUnlocked && stats.totalNotes >= 3) {
    return 'You\u2019re close to unlocking your Forest map — a few confirmed links does it.'
  }
  if (stats.lastNote) {
    const days = Math.floor(
      (Date.now() - new Date(stats.lastNote.createdAt).getTime()) / DAY_MS,
    )
    if (days >= 3) {
      return `It\u2019s been ${days} days since your last note — quick capture before you forget?`
    }
  }
  return null
}
