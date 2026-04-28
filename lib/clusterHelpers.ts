import { Note } from './types'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'as', 'by', 'at', 'from', 'into', 'about', 'this', 'that',
  'these', 'those', 'it', 'its', 'i', 'we', 'you', 'they', 'he', 'she', 'not',
  'no', 'yes', 'so', 'if', 'then', 'than', 'when', 'how', 'what', 'why', 'where',
  'note', 'notes', 'class', 'lecture', 'chapter', 'section', 'one', 'two',
  'three', 'four', 'five', 'use', 'used', 'using', 'also', 'all', 'any',
  'each', 'every', 'some', 'most', 'many', 'much', 'more', 'less', 'few',
])

export type LocalCluster = { noteIds: string[]; label: string }

// Extract a coarse 2-3 word topic label from note titles using common words
export function quickLabel(notes: { title: string }[]): string {
  if (notes.length === 1) return notes[0].title.slice(0, 32)
  // Look for common dash-separated suffix like "— Biology 201"
  const courseMatches = notes
    .map((n) => n.title.match(/[—–-]\s*(.+)$/))
    .filter(Boolean) as RegExpMatchArray[]
  if (courseMatches.length >= 2) {
    const counts: Record<string, number> = {}
    courseMatches.forEach((m) => { counts[m[1].trim()] = (counts[m[1].trim()] ?? 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (top && top[1] >= 2) return top[0]
  }
  // Otherwise, find common keyword
  const wordCounts: Record<string, number> = {}
  notes.forEach((n) => {
    const words = (n.title || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    new Set(words).forEach((w) => { wordCounts[w] = (wordCounts[w] ?? 0) + 1 })
  })
  const sorted = Object.entries(wordCounts).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 2).map(([w]) => w[0].toUpperCase() + w.slice(1))
  if (top.length === 0) return 'Related Notes'
  return top.join(' & ')
}

// Local heuristic partition: group of 3-4 by title similarity (fast, no AI)
export function localPartition(notes: Note[]): LocalCluster[] {
  if (notes.length === 0) return []
  if (notes.length <= 4) return [{ noteIds: notes.map((n) => n.id), label: quickLabel(notes) }]

  // Group by inferred course suffix or first tag
  const groups: Record<string, Note[]> = {}
  notes.forEach((n) => {
    const suffix = n.title.match(/[—–-]\s*(.+)$/)?.[1]?.trim()
    const tag = n.tags?.[0]
    const key = suffix || tag || 'misc'
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })

  const result: LocalCluster[] = []
  Object.values(groups).forEach((g) => {
    if (g.length <= 4) {
      result.push({ noteIds: g.map((n) => n.id), label: quickLabel(g) })
    } else {
      for (let i = 0; i < g.length; i += 4) {
        const slice = g.slice(i, i + 4)
        result.push({ noteIds: slice.map((n) => n.id), label: quickLabel(slice) })
      }
    }
  })
  return result
}

export function partitionCacheKey(noteIds: string[]): string {
  return [...noteIds].sort().join(',')
}
