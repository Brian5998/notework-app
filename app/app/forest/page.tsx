'use client'

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotes } from '@/lib/NotesContext'
import { useLinks, makeContradictionKey } from '@/lib/LinksContext'
import { useWorkspace } from '@/lib/WorkspaceContext'
import BubbleForestCanvas, {
  type BubbleData,
  type BubbleNoteData,
  type BubbleEdgeData,
  type GhostNodeData,
} from '@/components/app/BubbleForestCanvas'
import NeuralNetVisualizer from '@/components/app/NeuralNetVisualizer'
import StudySheetModal from '@/components/app/StudySheetModal'
import { localPartition, partitionCacheKey } from '@/lib/clusterHelpers'
import {
  CLUSTER_COLORS,
  inferColorKey,
  isClusterColorKey,
  type ClusterColorKey,
} from '@/lib/clusterColors'

const UNLOCK_THRESHOLD = 3
const PARTITION_CACHE_KEY = 'notework_partition_cache_v1'
const RECS_CACHE_KEY = 'notework_recommendations_cache_v1'
const COLOR_CACHE_KEY = 'notework_cluster_colors_v2' // bumped: classifier now returns topic + type

type SubCluster = {
  id: string
  noteIds: string[]
  label: string
  aiLabeled?: boolean
  colorKey: ClusterColorKey
  colorAiAssigned?: boolean
}
type GapItem = { concept: string; appears_in: string[]; suggestion: string }
type Recommendation = {
  topic: string
  why: string
  builds_on: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: 'next-step' | 'adjacent' | 'foundational'
}

export default function ForestPage() {
  const router = useRouter()
  const { notes, addNote } = useNotes()
  const { confirmedLinks, detectedContradictions, isContradictionDismissed } = useLinks()
  const { workspaceType } = useWorkspace()

  const [highlightedIds, setHighlightedIds] = useState<string[]>([])
  const [subClusters, setSubClusters] = useState<SubCluster[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [gaps, setGaps] = useState<GapItem[]>([])
  const [gapsLoading, setGapsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recsLoading, setRecsLoading] = useState(false)
  const [showRecsPanel, setShowRecsPanel] = useState(true)
  // Hidden trigger so users can re-open the learning guide
  const learningGuideHidden =
    !showRecsPanel && (recommendations.length > 0 || recsLoading)
  const [showNeuralPanel, setShowNeuralPanel] = useState(false)
  const [timelineValue, setTimelineValue] = useState(100)

  // Part 3 scaffolding — populated by later parts
  const [heatmapEnabled, setHeatmapEnabled] = useState(false)
  const [ghostNodes, setGhostNodes] = useState<GhostNodeData[]>([])
  const [showGhosts, setShowGhosts] = useState(false)
  const [shiftPath, setShiftPath] = useState<string[]>([])
  const [shiftPathEndpoints, setShiftPathEndpoints] = useState<{
    source: string | null
    target: string | null
  }>({ source: null, target: null })
  const [activeContradictionKey, setActiveContradictionKey] = useState<string | null>(null)
  const [studySheet, setStudySheet] = useState<{
    label: string
    noteIds: string[]
  } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('notework_conflict_highlight')
      if (stored) {
        setHighlightedIds(JSON.parse(stored))
        localStorage.removeItem('notework_conflict_highlight')
      }
    } catch {}
  }, [])

  const timeRange = useMemo(() => {
    const linkedIds = new Set(
      confirmedLinks.flatMap((l) => [l.sourceNoteId, l.targetNoteId]),
    )
    const linkedNotes = notes.filter((n) => linkedIds.has(n.id))
    if (linkedNotes.length === 0) return { min: 0, max: 0 }
    const times = linkedNotes.map((n) => new Date(n.createdAt).getTime())
    return { min: Math.min(...times), max: Math.max(...times) }
  }, [notes, confirmedLinks])

  const cutoffTime = useMemo(() => {
    if (timelineValue >= 100) return Infinity
    const { min, max } = timeRange
    if (max === min) return Infinity
    return min + ((max - min) * timelineValue) / 100
  }, [timelineValue, timeRange])

  const noteMap = useMemo(
    () => Object.fromEntries(notes.map((n) => [n.id, n])),
    [notes],
  )

  // All confirmed links for the linked notes (we always build bubbles from
  // all links — the time scrubber fades notes visually but doesn't change
  // topology).
  const fullLinks = useMemo(
    () =>
      confirmedLinks.filter((l) => noteMap[l.sourceNoteId] && noteMap[l.targetNoteId]),
    [confirmedLinks, noteMap],
  )

  const connectedComponents = useMemo(() => {
    const parent: Record<string, string> = {}
    const allIds = [...new Set(fullLinks.flatMap((l) => [l.sourceNoteId, l.targetNoteId]))]
    allIds.forEach((id) => {
      parent[id] = id
    })
    function find(x: string): string {
      if (parent[x] !== x) parent[x] = find(parent[x])
      return parent[x]
    }
    fullLinks.forEach((l) => {
      const pa = find(l.sourceNoteId),
        pb = find(l.targetNoteId)
      if (pa !== pb) parent[pa] = pb
    })
    const groups: Record<string, string[]> = {}
    allIds.forEach((id) => {
      const root = find(id)
      if (!groups[root]) groups[root] = []
      groups[root].push(id)
    })
    return Object.values(groups)
  }, [fullLinks])

  // ── Partition into sub-clusters with cached labels + inferred colors ─────
  // AI label enhancement runs in the background; AI color classification
  // (Part 2) is persisted per-cluster so it doesn't re-run each render.
  useEffect(() => {
    if (connectedComponents.length === 0) {
      setSubClusters([])
      return
    }

    let scId = 0

    const partitionCache: Record<string, { label: string; cachedAt: number }> = (() => {
      try {
        return JSON.parse(localStorage.getItem(PARTITION_CACHE_KEY) ?? '{}')
      } catch {
        return {}
      }
    })()

    const colorCache: Record<string, ClusterColorKey> = (() => {
      try {
        const raw = JSON.parse(localStorage.getItem(COLOR_CACHE_KEY) ?? '{}')
        const out: Record<string, ClusterColorKey> = {}
        for (const k of Object.keys(raw)) {
          if (isClusterColorKey(raw[k])) out[k] = raw[k]
        }
        return out
      } catch {
        return {}
      }
    })()

    const localClusters: SubCluster[] = []
    const componentsToEnhance: { component: string[] }[] = []
    const clustersNeedingAIColor: {
      cacheKey: string
      clusterId: string
      label: string
      titles: string[]
      contents: string[]
    }[] = []

    connectedComponents.forEach((component) => {
      const ns = component.map((id) => noteMap[id]).filter(Boolean)
      const localParts = localPartition(ns)
      const enhanced: SubCluster[] = localParts.map((p) => {
        const cacheKey = partitionCacheKey(p.noteIds)
        const cachedLabel = partitionCache[cacheKey]
        const label = cachedLabel?.label ?? p.label
        const cachedColor = colorCache[cacheKey]
        const colorKey: ClusterColorKey = cachedColor ?? inferColorKey(label)
        const sc: SubCluster = {
          id: `sc-${scId++}`,
          noteIds: p.noteIds,
          label,
          aiLabeled: !!cachedLabel,
          colorKey,
          colorAiAssigned: !!cachedColor,
        }
        if (!cachedColor) {
          const pNotes = p.noteIds.map((id) => noteMap[id]).filter(Boolean)
          clustersNeedingAIColor.push({
            cacheKey,
            clusterId: sc.id,
            label,
            titles: pNotes.map((n) => n.title),
            contents: pNotes.map((n) => n.content),
          })
        }
        return sc
      })
      localClusters.push(...enhanced)
      const needsAI = enhanced.filter((e) => !e.aiLabeled)
      if (needsAI.length > 0) componentsToEnhance.push({ component })
    })

    setSubClusters(localClusters)

    let cancelled = false

    const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs = 12000) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      return fetch(url, { ...options, signal: controller.signal }).finally(() =>
        clearTimeout(timer),
      )
    }

    // 1. Background: AI labels for sub-clusters
    if (componentsToEnhance.length > 0) {
      Promise.all(
        componentsToEnhance.map(async ({ component }) => {
          const ns = component.map((id) => noteMap[id]).filter(Boolean)
          try {
            const res = await fetchWithTimeout('/api/cluster-partition', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                notes: ns.map((n) => ({ id: n.id, title: n.title, content: n.content })),
              }),
            })
            const data = await res.json()
            return data.clusters ?? []
          } catch {
            return []
          }
        }),
      ).then((aiResults) => {
        if (cancelled) return
        const newCache = { ...partitionCache }
        const aiLabelByKey: Record<string, string> = {}
        aiResults.flat().forEach((c: { noteIds: string[]; label: string }) => {
          if (Array.isArray(c.noteIds) && typeof c.label === 'string') {
            const key = partitionCacheKey(c.noteIds)
            newCache[key] = { label: c.label, cachedAt: Date.now() }
            aiLabelByKey[key] = c.label
          }
        })
        try {
          localStorage.setItem(PARTITION_CACHE_KEY, JSON.stringify(newCache))
        } catch {}
        setSubClusters((prev) =>
          prev.map((sc) => {
            const key = partitionCacheKey(sc.noteIds)
            const aiLabel = aiLabelByKey[key]
            if (!aiLabel) return sc
            // If AI gave us a better label AND we don't have an AI color yet,
            // re-infer heuristically — Part 2 AI classification will overwrite.
            const nextColor = sc.colorAiAssigned ? sc.colorKey : inferColorKey(aiLabel)
            return { ...sc, label: aiLabel, aiLabeled: true, colorKey: nextColor }
          }),
        )
      })
    }

    // 2. Background: AI color classification (Part 2) for uncolored clusters
    if (clustersNeedingAIColor.length > 0) {
      ;(async () => {
        const newColors: Record<string, ClusterColorKey> = {}
        await Promise.all(
          clustersNeedingAIColor.map(async ({ cacheKey, clusterId, label, titles, contents }) => {
            try {
              const res = await fetchWithTimeout(
                '/api/cluster-topic',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ titles, contents, label, classify: true }),
                },
                15000,
              )
              const data = await res.json()
              const rawType: unknown = data?.type
              const aiTopic: string | undefined =
                typeof data?.topic === 'string' ? data.topic.trim() : undefined
              if (isClusterColorKey(rawType)) {
                newColors[cacheKey] = rawType
                setSubClusters((prev) =>
                  prev.map((sc) => {
                    if (sc.id !== clusterId) return sc
                    // Also upgrade the label from the classifier when the
                    // cluster hasn't already been AI-labeled by /cluster-partition.
                    const nextLabel =
                      !sc.aiLabeled && aiTopic && aiTopic.length > 0
                        ? aiTopic
                        : sc.label
                    return {
                      ...sc,
                      label: nextLabel,
                      aiLabeled: sc.aiLabeled || (!!aiTopic && aiTopic.length > 0),
                      colorKey: rawType,
                      colorAiAssigned: true,
                    }
                  }),
                )
              }
            } catch {
              // keep heuristic color
            }
          }),
        )
        if (cancelled) return
        if (Object.keys(newColors).length > 0) {
          try {
            const merged = { ...colorCache, ...newColors }
            localStorage.setItem(COLOR_CACHE_KEY, JSON.stringify(merged))
          } catch {}
        }
      })()
    }

    return () => {
      cancelled = true
    }
  }, [connectedComponents, noteMap])

  // ── Gaps + recommendations (unchanged logic) ─────────────────────────────
  const fetchGaps = useCallback(async () => {
    if (notes.length < 3 || fullLinks.length < 2) return
    setGapsLoading(true)
    try {
      const pairs = fullLinks.map((l) => ({
        from: noteMap[l.sourceNoteId]?.title ?? '',
        to: noteMap[l.targetNoteId]?.title ?? '',
      }))
      const res = await fetch('/api/forest-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, confirmedLinkPairs: pairs, workspaceType }),
      })
      const data = await res.json()
      setGaps(data.gaps ?? [])
    } catch {
      setGaps([])
    } finally {
      setGapsLoading(false)
    }
  }, [notes, fullLinks, noteMap, workspaceType])

  const fetchRecommendations = useCallback(async () => {
    if (notes.length < 3) return
    const noteFingerprint =
      notes
        .slice(0, 25)
        .map((n) => n.id)
        .sort()
        .join(',') +
      '|' +
      workspaceType
    try {
      const cached = JSON.parse(localStorage.getItem(RECS_CACHE_KEY) ?? '{}')
      if (cached.fingerprint === noteFingerprint && cached.recs?.length) {
        setRecommendations(cached.recs)
        return
      }
    } catch {}

    setRecsLoading(true)
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes.slice(0, 25).map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            tags: n.tags,
          })),
          workspaceType,
        }),
      })
      const data = await res.json()
      const recs = data.recommendations ?? []
      setRecommendations(recs)
      try {
        localStorage.setItem(RECS_CACHE_KEY, JSON.stringify({ fingerprint: noteFingerprint, recs }))
      } catch {}
    } catch {
      setRecommendations([])
    } finally {
      setRecsLoading(false)
    }
  }, [notes, workspaceType])

  useEffect(() => {
    if (subClusters.length > 0) {
      fetchGaps()
      fetchRecommendations()
    }
  }, [subClusters.length, fetchGaps, fetchRecommendations])

  // ── Connection counts (used for note radius + preview panel) ─────────────
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    fullLinks.forEach((l) => {
      counts[l.sourceNoteId] = (counts[l.sourceNoteId] ?? 0) + 1
      counts[l.targetNoteId] = (counts[l.targetNoteId] ?? 0) + 1
    })
    return counts
  }, [fullLinks])

  // ── Build bubbles / notes / edges for the new canvas ─────────────────────
  const noteToBubble = useMemo(() => {
    const m = new Map<string, string>()
    subClusters.forEach((sc) => sc.noteIds.forEach((id) => m.set(id, sc.id)))
    return m
  }, [subClusters])

  // Filter clusters to only include note ids that still exist in noteMap.
  // Without this, a bubble can render with a `noteCount` that doesn't match
  // the actual SimNotes inside, causing the simulation to "fall apart"
  // (oversized parent bubble with floating orphan references).
  const cleanClusters = useMemo(
    () =>
      subClusters
        .map((sc) => ({
          ...sc,
          noteIds: sc.noteIds.filter((id) => noteMap[id]),
        }))
        .filter((sc) => sc.noteIds.length > 0),
    [subClusters, noteMap],
  )

  const bubbles: BubbleData[] = useMemo(
    () =>
      cleanClusters.map((sc) => ({
        id: sc.id,
        label: sc.label,
        noteIds: sc.noteIds,
        noteCount: sc.noteIds.length,
        colorKey: sc.colorKey,
      })),
    [cleanClusters],
  )

  const bubbleNotes: BubbleNoteData[] = useMemo(() => {
    const out: BubbleNoteData[] = []
    for (const sc of cleanClusters) {
      for (const id of sc.noteIds) {
        const note = noteMap[id]
        if (!note) continue
        out.push({
          id,
          bubbleId: sc.id,
          label: note.title || 'Untitled',
          connectionCount: connectionCounts[id] ?? 0,
          createdAt: note.createdAt,
        })
      }
    }
    return out
  }, [cleanClusters, noteMap, connectionCounts])

  // Part 3B: map edges to contradictions
  const contradictionEdgeKeys = useMemo(() => {
    const m = new Map<string, string>() // "a||b" sorted -> contradiction key
    for (const c of detectedContradictions) {
      const key = makeContradictionKey(c.noteIds, c.explanation)
      if (isContradictionDismissed(key)) continue
      if (c.noteIds.length < 2) continue
      for (let i = 0; i < c.noteIds.length; i++) {
        for (let j = i + 1; j < c.noteIds.length; j++) {
          const k = [c.noteIds[i], c.noteIds[j]].sort().join('||')
          m.set(k, key)
        }
      }
    }
    return m
  }, [detectedContradictions, isContradictionDismissed])

  const bubbleEdges: BubbleEdgeData[] = useMemo(() => {
    return fullLinks.map((l) => {
      const k = [l.sourceNoteId, l.targetNoteId].sort().join('||')
      const contradictionKey = contradictionEdgeKeys.get(k)
      return {
        source: l.sourceNoteId,
        target: l.targetNoteId,
        reason: l.reason,
        confirmed: true,
        strength: 0.7,
        contradiction: contradictionKey ? { key: contradictionKey } : undefined,
      }
    })
  }, [fullLinks, contradictionEdgeKeys])

  // Part 3A — knowledge density per bubble
  const densities: Record<string, number> = useMemo(() => {
    const raw: Record<string, number> = {}
    let max = 0
    for (const sc of subClusters) {
      let linkCount = 0
      const ids = new Set(sc.noteIds)
      for (const l of fullLinks) {
        if (ids.has(l.sourceNoteId) || ids.has(l.targetNoteId)) linkCount++
      }
      const d = sc.noteIds.length * (1 + linkCount * 0.5)
      raw[sc.id] = d
      if (d > max) max = d
    }
    if (max === 0) return {}
    const normalized: Record<string, number> = {}
    for (const id of Object.keys(raw)) normalized[id] = raw[id] / max
    return normalized
  }, [subClusters, fullLinks])

  // Part 3C — which notes are "currently visible" based on scrubber
  const visibleNoteIds: Set<string> | undefined = useMemo(() => {
    if (timelineValue >= 100 || cutoffTime === Infinity) return undefined
    const s = new Set<string>()
    for (const n of notes) {
      if (new Date(n.createdAt).getTime() <= cutoffTime) s.add(n.id)
    }
    return s
  }, [notes, cutoffTime, timelineValue])

  // ── Node/edge interactions ───────────────────────────────────────────────
  function handleNodeClick(
    nodeId: string,
    type: 'note' | 'bubble',
    shiftKey: boolean,
  ) {
    if (shiftKey && type === 'note') {
      handleShiftClick(nodeId)
      return
    }
    if (type === 'note') setSelectedNoteId(nodeId)
  }

  // Part 3E — path tracer via shift-click
  function handleShiftClick(noteId: string) {
    setShiftPathEndpoints((prev) => {
      if (!prev.source) return { source: noteId, target: null }
      if (prev.source === noteId) return { source: null, target: null }
      return { source: prev.source, target: noteId }
    })
  }

  // Compute shortest confirmed-link path between the two endpoints
  useEffect(() => {
    const { source, target } = shiftPathEndpoints
    if (!source || !target) {
      setShiftPath([])
      return
    }
    // BFS over note graph using confirmed links
    const adj = new Map<string, string[]>()
    for (const l of fullLinks) {
      if (!adj.has(l.sourceNoteId)) adj.set(l.sourceNoteId, [])
      if (!adj.has(l.targetNoteId)) adj.set(l.targetNoteId, [])
      adj.get(l.sourceNoteId)!.push(l.targetNoteId)
      adj.get(l.targetNoteId)!.push(l.sourceNoteId)
    }
    const visited = new Set<string>([source])
    const prev = new Map<string, string>()
    const queue: string[] = [source]
    let found = false
    while (queue.length) {
      const cur = queue.shift()!
      if (cur === target) {
        found = true
        break
      }
      for (const n of adj.get(cur) ?? []) {
        if (visited.has(n)) continue
        visited.add(n)
        prev.set(n, cur)
        queue.push(n)
      }
    }
    if (!found) {
      setShiftPath([])
      return
    }
    const path: string[] = [target]
    let cur = target
    while (prev.has(cur)) {
      cur = prev.get(cur)!
      path.unshift(cur)
    }
    setShiftPath(path)
  }, [shiftPathEndpoints, fullLinks])

  function clearPath() {
    setShiftPath([])
    setShiftPathEndpoints({ source: null, target: null })
  }

  // Part 3D — fetch gap concept ghost nodes
  const fetchGhosts = useCallback(async () => {
    if (subClusters.length < 2) return
    try {
      const res = await fetch('/api/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusters: subClusters.map((sc) => ({
            id: sc.id,
            label: sc.label,
            sampleTitles: sc.noteIds
              .map((id) => noteMap[id]?.title ?? '')
              .filter(Boolean)
              .slice(0, 4),
          })),
          confirmedLinks: fullLinks.map((l) => ({
            from: noteMap[l.sourceNoteId]?.title ?? '',
            to: noteMap[l.targetNoteId]?.title ?? '',
            reason: l.reason,
          })),
        }),
      })
      const data = await res.json()
      const list: { concept: string; bridges: string[] }[] = data.gaps ?? []
      const labelToId = new Map<string, string>()
      for (const sc of subClusters) labelToId.set(sc.label.toLowerCase(), sc.id)
      const ghosts: GhostNodeData[] = list.slice(0, 5).map((g, i) => {
        const nearby = (g.bridges ?? [])
          .map((lbl) => labelToId.get((lbl ?? '').toLowerCase()))
          .filter((x): x is string => !!x)
        return {
          id: `ghost-${i}`,
          concept: g.concept,
          nearbyBubbleIds: nearby.length > 0 ? nearby : subClusters.slice(0, 2).map((b) => b.id),
        }
      })
      setGhostNodes(ghosts)
      setShowGhosts(true)
    } catch {
      setGhostNodes([])
    }
  }, [subClusters, fullLinks, noteMap])

  function handleGhostClick(concept: string) {
    const note = addNote(concept, `# ${concept}\n\n(new note suggested by Drift)`)
    try {
      localStorage.setItem('notework_selected_note', note.id)
    } catch {}
    router.push('/app')
  }

  // Part 3B — contradiction panel handlers
  const activeContradiction = useMemo(() => {
    if (!activeContradictionKey) return null
    return detectedContradictions.find(
      (c) => makeContradictionKey(c.noteIds, c.explanation) === activeContradictionKey,
    )
  }, [activeContradictionKey, detectedContradictions])

  function handleContradictionClick(key: string) {
    setActiveContradictionKey(key)
  }

  function resolveContradictionEditNewer() {
    if (!activeContradiction) return
    const relevantNotes = activeContradiction.noteIds
      .map((id) => noteMap[id])
      .filter(Boolean)
    if (relevantNotes.length === 0) return
    const newest = relevantNotes.reduce((a, b) =>
      new Date(a.createdAt).getTime() > new Date(b.createdAt).getTime() ? a : b,
    )
    try {
      localStorage.setItem('notework_selected_note', newest.id)
    } catch {}
    router.push('/app')
  }

  const selectedNote = selectedNoteId ? noteMap[selectedNoteId] : null

  const timelineLabel = useMemo(() => {
    if (timelineValue >= 100 || cutoffTime === Infinity) return 'Today'
    return new Date(cutoffTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [timelineValue, cutoffTime])

  // ── Unlock gate ──────────────────────────────────────────────────────────
  if (confirmedLinks.length < UNLOCK_THRESHOLD) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          background: '#050a18',
          color: 'rgba(220,225,240,0.7)',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          style={{
            width: 44,
            height: 44,
            stroke: 'rgba(220,225,240,0.35)',
            fill: 'none',
            strokeWidth: 1.2,
          }}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p style={{ fontSize: '1.1rem' }}>
          Forest View unlocks after {UNLOCK_THRESHOLD} confirmed connections
        </p>
        <p style={{ fontSize: '0.95rem', color: 'rgba(220,225,240,0.45)' }}>
          {confirmedLinks.length} / {UNLOCK_THRESHOLD} so far
        </p>
        <Link
          href="/app"
          style={{
            marginTop: '0.5rem',
            color: '#7EE8A2',
            fontSize: '0.95rem',
            textDecoration: 'none',
          }}
        >
          ← Back to notes
        </Link>
      </div>
    )
  }

  const bubbleCount = bubbles.length
  const noteCount = bubbleNotes.length

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#050a18',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        color: '#e8ecf7',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid rgba(120,150,210,0.12)',
          flexShrink: 0,
          background: 'rgba(5,10,24,0.92)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link
          href="/app"
          style={{
            color: 'rgba(220,225,240,0.7)',
            fontSize: '0.95rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          ← Back
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: '1.5rem',
              color: '#f1f4ff',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Note
            <span style={{ color: '#7EE8A2', fontStyle: 'italic' }}>work</span>
          </span>
          <span style={{ color: 'rgba(220,225,240,0.45)', fontSize: '0.9rem' }}>Forest</span>
        </div>

        <div
          style={{
            fontSize: '0.82rem',
            color: 'rgba(220,225,240,0.55)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          {bubbleCount > 0 && (
            <span>
              {bubbleCount} cluster{bubbleCount !== 1 ? 's' : ''}
            </span>
          )}
          {noteCount > 0 && (
            <span>
              {noteCount} note{noteCount !== 1 ? 's' : ''}
            </span>
          )}
          <span>
            {bubbleEdges.length} link{bubbleEdges.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Canvas + floating controls */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {bubbles.length === 0 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                color: 'rgba(220,225,240,0.45)',
              }}
            >
              <p style={{ fontSize: '1.05rem' }}>No connected notes yet.</p>
              <button
                onClick={() => router.push('/app')}
                style={{
                  color: '#7EE8A2',
                  fontSize: '0.95rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Confirm some connections →
              </button>
            </div>
          ) : (
            <BubbleForestCanvas
              bubbles={bubbles}
              notes={bubbleNotes}
              edges={bubbleEdges}
              onNodeClick={handleNodeClick}
              onContradictionClick={handleContradictionClick}
              onGhostClick={handleGhostClick}
              highlightedNodeIds={highlightedIds}
              heatmapEnabled={heatmapEnabled}
              densities={densities}
              ghosts={showGhosts ? ghostNodes : []}
              highlightedPath={shiftPath}
              visibleNoteIds={visibleNoteIds}
            />
          )}

          {/* Floating control bar — top-right of canvas */}
          <FloatingControlBar
            showNeural={showNeuralPanel}
            toggleNeural={() => setShowNeuralPanel((s) => !s)}
            heatmap={heatmapEnabled}
            toggleHeatmap={() => setHeatmapEnabled((s) => !s)}
            ghostsVisible={showGhosts && ghostNodes.length > 0}
            toggleGhosts={() => {
              if (ghostNodes.length === 0) {
                fetchGhosts()
              } else {
                setShowGhosts((s) => !s)
              }
            }}
            onRefreshGhosts={fetchGhosts}
          />

          {/* Cluster legend (with per-cluster Study Sheet button) */}
          <ClusterLegend
            bubbles={bubbles}
            onStudySheet={(label, noteIds) =>
              setStudySheet({ label, noteIds })
            }
          />

          {/* Shift-path banner */}
          {shiftPath.length > 0 && (
            <PathBanner
              path={shiftPath}
              nodeTitle={(id) => noteMap[id]?.title ?? 'Untitled'}
              onClear={clearPath}
            />
          )}
          {shiftPathEndpoints.source &&
            shiftPathEndpoints.target &&
            shiftPath.length === 0 && (
              <PathBanner
                empty
                nodeTitle={(id) => noteMap[id]?.title ?? 'Untitled'}
                onClear={clearPath}
              />
            )}

          {/* Timeline scrubber */}
          <TimelineScrubber
            value={timelineValue}
            onChange={setTimelineValue}
            label={timelineLabel}
            onReset={() => setTimelineValue(100)}
          />
        </div>

        {/* Note preview drawer */}
        {selectedNote && (
          <SlideDrawer onClose={() => setSelectedNoteId(null)} width={380}>
            <div
              style={{
                padding: '1rem 1.15rem',
                borderBottom: '1px solid rgba(120,150,210,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'rgba(220,225,240,0.45)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  fontFamily: 'var(--font-syne, system-ui), sans-serif',
                }}
              >
                Preview
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem('notework_selected_note', selectedNoteId!)
                    } catch {}
                    router.push('/app')
                  }}
                  style={{
                    background: 'rgba(126,232,162,0.12)',
                    border: '1px solid rgba(126,232,162,0.35)',
                    borderRadius: 8,
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.82rem',
                    color: '#7EE8A2',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Open →
                </button>
                <button
                  onClick={() => setSelectedNoteId(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(220,225,240,0.5)',
                    cursor: 'pointer',
                    fontSize: '1.3rem',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ padding: '1.25rem 1.15rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                  fontSize: '1.65rem',
                  color: '#f1f4ff',
                  fontWeight: 400,
                  marginBottom: '0.6rem',
                  lineHeight: 1.25,
                }}
              >
                {selectedNote.title || 'Untitled'}
              </h2>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'rgba(220,225,240,0.45)',
                  marginBottom: '1.25rem',
                }}
              >
                {new Date(selectedNote.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' · '}
                {connectionCounts[selectedNoteId!] ?? 0} connection
                {(connectionCounts[selectedNoteId!] ?? 0) !== 1 ? 's' : ''}
              </div>
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  {selectedNote.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 99,
                        background: 'rgba(120,150,210,0.08)',
                        color: 'rgba(220,225,240,0.7)',
                        border: '1px solid rgba(120,150,210,0.15)',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{
                  fontSize: '0.95rem',
                  color: 'rgba(220,225,240,0.75)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedNote.content.slice(0, 800)}
                {selectedNote.content.length > 800 && (
                  <span style={{ color: 'rgba(220,225,240,0.45)' }}> …</span>
                )}
              </div>
            </div>
          </SlideDrawer>
        )}

        {/* Contradiction resolve drawer (Part 3B) */}
        {activeContradiction && (
          <SlideDrawer
            onClose={() => setActiveContradictionKey(null)}
            width={440}
            accentColor="#ef4444"
          >
            <div
              style={{
                padding: '1rem 1.15rem',
                borderBottom: '1px solid rgba(239,68,68,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#ef4444',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontFamily: 'var(--font-syne, system-ui), sans-serif',
                }}
              >
                Contradiction
              </span>
              <button
                onClick={() => setActiveContradictionKey(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(220,225,240,0.5)',
                  cursor: 'pointer',
                  fontSize: '1.3rem',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.15rem' }}>
              <p
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.55,
                  color: '#f1f4ff',
                  marginBottom: '1rem',
                }}
              >
                {activeContradiction.explanation}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {activeContradiction.noteIds.map((id) => {
                  const note = noteMap[id]
                  if (!note) return null
                  return (
                    <div
                      key={id}
                      style={{
                        padding: '0.85rem 1rem',
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'rgba(220,225,240,0.5)',
                          fontFamily: 'var(--font-dm-mono, ui-monospace), monospace',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {new Date(note.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                          fontSize: '1.15rem',
                          marginBottom: '0.4rem',
                          color: '#f1f4ff',
                        }}
                      >
                        {note.title || 'Untitled'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: 'rgba(220,225,240,0.7)',
                          lineHeight: 1.55,
                          maxHeight: 120,
                          overflow: 'hidden',
                        }}
                      >
                        {note.content.slice(0, 260)}
                        {note.content.length > 260 ? '…' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={resolveContradictionEditNewer}
                style={{
                  marginTop: '1.25rem',
                  width: '100%',
                  padding: '0.7rem 1rem',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-syne, system-ui), sans-serif',
                  letterSpacing: '0.02em',
                }}
              >
                Resolve — edit newer note →
              </button>
            </div>
          </SlideDrawer>
        )}
      </div>

      {/* Study Sheet modal — generates a 1-page sheet from a cluster's notes */}
      {studySheet && (
        <StudySheetModal
          topic={studySheet.label}
          notes={studySheet.noteIds
            .map((id) => noteMap[id])
            .filter(Boolean) as typeof notes}
          onClose={() => setStudySheet(null)}
          onSelectNote={(id) => {
            try {
              localStorage.setItem('notework_selected_note', id)
            } catch {}
            router.push('/app')
          }}
        />
      )}

      {/* Neural net visualizer panel */}
      {showNeuralPanel && (
        <div
          style={{
            borderTop: '1px solid rgba(120,150,210,0.12)',
            background: '#050a18',
            padding: '1.25rem 1.5rem 1.5rem',
            flexShrink: 0,
            animation: 'neuralPanelIn 0.22s ease-out',
          }}
        >
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <NeuralNetVisualizer />
          </div>
        </div>
      )}

      {/* Re-open trigger when hidden */}
      {learningGuideHidden && (
        <button
          onClick={() => setShowRecsPanel(true)}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            background: 'rgba(10,18,38,0.92)',
            border: '1px solid rgba(126,232,162,0.4)',
            color: '#7EE8A2',
            fontSize: '0.95rem',
            fontWeight: 600,
            padding: '0.65rem 1.1rem',
            borderRadius: 99,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 50,
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Show learning guide
        </button>
      )}

      {/* Recommendations panel — "next topics & you might also like" */}
      {showRecsPanel && (recommendations.length > 0 || recsLoading) && (
        <div
          style={{
            borderTop: '1px solid rgba(120,150,210,0.12)',
            background: '#0A1226',
            flexShrink: 0,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '1rem 1.5rem 0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.85rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                  fontSize: '1.4rem',
                  color: '#f1f4ff',
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                }}
              >
                Your <span style={{ color: '#7EE8A2', fontStyle: 'italic' }}>learning guide</span>
              </span>
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'rgba(220,225,240,0.55)',
                  fontWeight: 500,
                }}
              >
                {recsLoading ? 'thinking…' : 'tap a card to start a note on it'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                onClick={fetchRecommendations}
                disabled={recsLoading}
                title="Regenerate recommendations"
                style={{
                  background: 'rgba(120,150,210,0.08)',
                  border: '1px solid rgba(120,150,210,0.2)',
                  color: 'rgba(220,225,240,0.85)',
                  borderRadius: 10,
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  cursor: recsLoading ? 'wait' : 'pointer',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowRecsPanel(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(120,150,210,0.2)',
                  color: 'rgba(220,225,240,0.5)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 10,
                }}
                title="Hide panel"
              >
                Hide
              </button>
            </div>
          </div>
          {recsLoading && recommendations.length === 0 ? (
            <div
              style={{
                display: 'flex',
                gap: '0.85rem',
                padding: '0 1.5rem 1rem',
                overflowX: 'auto',
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    minWidth: 280,
                    height: 130,
                    background: 'rgba(120,150,210,0.05)',
                    border: '1px solid rgba(120,150,210,0.12)',
                    borderRadius: 14,
                    animation: 'skeletonPulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: '0.85rem',
                padding: '0 1.5rem 1.25rem',
                overflowX: 'auto',
              }}
            >
              {recommendations.map((rec, idx) => (
                <RecCard
                  key={`${rec.topic}-${idx}`}
                  rec={rec}
                  onCreateNote={() => {
                    const note = addNote(
                      rec.topic,
                      `# ${rec.topic}\n\n${rec.why}\n\n${rec.builds_on?.length ? `Builds on: ${rec.builds_on.join(', ')}` : ''}`,
                    )
                    try {
                      localStorage.setItem('notework_selected_note', note.id)
                    } catch {}
                    router.push('/app')
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gaps indicator */}
      {(gaps.length > 0 || gapsLoading) && (
        <div
          style={{
            borderTop: '1px solid rgba(120,150,210,0.12)',
            padding: '0.85rem 1.5rem',
            background: '#050a18',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(220,225,240,0.55)',
              marginBottom: '0.55rem',
              fontFamily: 'var(--font-syne, system-ui), sans-serif',
            }}
          >
            Unconnected concepts worth exploring
          </div>
          {gapsLoading ? (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 14,
                    width: `${70 + i * 25}px`,
                    background: 'rgba(120,150,210,0.1)',
                    borderRadius: 4,
                    animation: 'skeletonPulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {gaps.map((g) => (
                <div
                  key={g.concept}
                  title={g.suggestion}
                  style={{
                    padding: '0.35rem 0.75rem',
                    background: 'rgba(245,200,66,0.08)',
                    border: '1px solid rgba(245,200,66,0.3)',
                    borderRadius: 99,
                    fontSize: '0.85rem',
                    color: '#fbbf24',
                    cursor: 'help',
                  }}
                >
                  {g.concept}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function FloatingControlBar({
  showNeural,
  toggleNeural,
  heatmap,
  toggleHeatmap,
  ghostsVisible,
  toggleGhosts,
  onRefreshGhosts,
}: {
  showNeural: boolean
  toggleNeural: () => void
  heatmap: boolean
  toggleHeatmap: () => void
  ghostsVisible: boolean
  toggleGhosts: () => void
  onRefreshGhosts: () => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        gap: '0.4rem',
        padding: '0.4rem',
        background: 'rgba(10,18,38,0.88)',
        border: '1px solid rgba(120,150,210,0.15)',
        borderRadius: 12,
        backdropFilter: 'blur(10px)',
      }}
    >
      <IconToggle
        active={heatmap}
        onClick={toggleHeatmap}
        title="Knowledge density heatmap — warm for dense clusters, cool for sparse"
        label="Heatmap"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3.5" fill="currentColor" opacity=".55" />
          <circle cx="12" cy="12" r="7" opacity=".55" />
          <circle cx="12" cy="12" r="10" opacity=".4" />
        </svg>
      </IconToggle>
      <IconToggle
        active={ghostsVisible}
        onClick={toggleGhosts}
        onAltClick={onRefreshGhosts}
        title="Analyze conceptual gaps — suggests bridge concepts between clusters"
        label="Analyze Gaps"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </IconToggle>
      <IconToggle
        active={showNeural}
        onClick={toggleNeural}
        title="An interactive neural net to visualize how learning works"
        label="Neural net"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="5" cy="6" r="1.5" />
          <circle cx="5" cy="18" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="6" r="1.5" />
          <circle cx="19" cy="18" r="1.5" />
          <line x1="5" y1="6" x2="12" y2="12" />
          <line x1="5" y1="18" x2="12" y2="12" />
          <line x1="12" y1="12" x2="19" y2="6" />
          <line x1="12" y1="12" x2="19" y2="18" />
        </svg>
      </IconToggle>
    </div>
  )
}

function IconToggle({
  active,
  onClick,
  onAltClick,
  title,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  onAltClick?: () => void
  title: string
  label: string
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={(e) => {
        if (e.altKey && onAltClick) onAltClick()
        else onClick()
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={{
        background: active
          ? 'rgba(126,232,162,0.15)'
          : hovered
            ? 'rgba(120,150,210,0.12)'
            : 'transparent',
        border: `1px solid ${active ? 'rgba(126,232,162,0.4)' : 'rgba(120,150,210,0.15)'}`,
        color: active ? '#7EE8A2' : 'rgba(220,225,240,0.65)',
        borderRadius: 8,
        padding: '0.45rem 0.75rem',
        fontSize: '0.78rem',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontFamily: 'var(--font-syne, system-ui), sans-serif',
        letterSpacing: '0.01em',
        transition: 'all .15s ease',
      }}
    >
      {children}
      {label}
    </button>
  )
}

function ClusterLegend({
  bubbles,
  onStudySheet,
}: {
  bubbles: BubbleData[]
  onStudySheet?: (label: string, noteIds: string[]) => void
}) {
  const list = useMemo(
    () =>
      [...bubbles]
        .sort((a, b) => b.noteCount - a.noteCount)
        .slice(0, 8),
    [bubbles],
  )
  if (list.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        padding: '0.85rem 0.95rem 0.65rem',
        background: 'rgba(10,18,38,0.85)',
        border: '1px solid rgba(120,150,210,0.18)',
        borderRadius: 14,
        backdropFilter: 'blur(10px)',
        maxWidth: 260,
        maxHeight: 'min(72vh, 520px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(220,225,240,0.55)',
          fontWeight: 700,
          fontFamily: 'var(--font-syne, system-ui), sans-serif',
          marginBottom: '0.4rem',
        }}
      >
        Clusters
      </div>
      {list.map((b) => {
        const p = CLUSTER_COLORS[b.colorKey] ?? CLUSTER_COLORS.unassigned
        return (
          <div
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.4rem 0.4rem',
              borderRadius: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                'rgba(120,150,210,0.08)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                'transparent')
            }
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: p.fill,
                border: `1.5px solid ${p.border}`,
                boxShadow: `0 0 8px ${p.glow}`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: '#f1f4ff',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.005em',
                }}
                title={b.label}
              >
                {b.label}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: '0.66rem',
                  color: 'rgba(220,225,240,0.45)',
                }}
              >
                {b.noteCount} note{b.noteCount === 1 ? '' : 's'}
              </div>
            </div>
            {onStudySheet && b.noteCount >= 2 && (
              <button
                onClick={() => onStudySheet(b.label, b.noteIds)}
                title="Generate a study sheet from this cluster"
                style={{
                  background: 'rgba(126,232,162,0.14)',
                  border: '1px solid rgba(126,232,162,0.35)',
                  color: '#7EE8A2',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.5rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-syne, system-ui), sans-serif',
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                }}
              >
                Sheet
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TimelineScrubber({
  value,
  onChange,
  label,
  onReset,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  onReset: () => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '1.25rem',
        left: '10%',
        right: '10%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '0.65rem 1.1rem',
        background: 'rgba(10,18,38,0.88)',
        border: '1px solid rgba(120,150,210,0.15)',
        borderRadius: 14,
        backdropFilter: 'blur(10px)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill="none"
        stroke="rgba(220,225,240,0.6)"
        strokeWidth="1.5"
        style={{ flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(220,225,240,0.5)',
          fontFamily: 'var(--font-syne, system-ui), sans-serif',
          flexShrink: 0,
        }}
      >
        View knowledge as of
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, height: 18, cursor: 'pointer' }}
      />
      <span
        style={{
          fontSize: '0.82rem',
          color: '#f1f4ff',
          minWidth: 90,
          textAlign: 'right',
          fontFamily: 'var(--font-dm-mono, ui-monospace), monospace',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </span>
      {value < 100 && (
        <button
          onClick={onReset}
          style={{
            background: 'rgba(126,232,162,0.1)',
            border: '1px solid rgba(126,232,162,0.3)',
            color: '#7EE8A2',
            padding: '0.3rem 0.6rem',
            borderRadius: 8,
            fontSize: '0.72rem',
            cursor: 'pointer',
            fontWeight: 500,
            fontFamily: 'var(--font-syne, system-ui), sans-serif',
          }}
        >
          Reset
        </button>
      )}
    </div>
  )
}

function PathBanner({
  path,
  empty,
  nodeTitle,
  onClear,
}: {
  path?: string[]
  empty?: boolean
  nodeTitle: (id: string) => string
  onClear: () => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '4.3rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '0.55rem 1rem',
        background: 'rgba(10,18,38,0.92)',
        border: '1px solid rgba(251,191,36,0.35)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        backdropFilter: 'blur(10px)',
        maxWidth: '70%',
      }}
    >
      <span
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#fbbf24',
          fontWeight: 600,
          fontFamily: 'var(--font-syne, system-ui), sans-serif',
          flexShrink: 0,
        }}
      >
        Path
      </span>
      {empty ? (
        <span
          style={{
            fontSize: '0.82rem',
            color: 'rgba(220,225,240,0.75)',
          }}
        >
          No confirmed path — try linking these concepts
        </span>
      ) : (
        <span
          style={{
            fontSize: '0.82rem',
            color: '#f1f4ff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {path!.map((id, i) => (
            <span key={id}>
              {i > 0 && <span style={{ color: '#fbbf24', margin: '0 0.4em' }}>→</span>}
              {nodeTitle(id)}
            </span>
          ))}
        </span>
      )}
      <button
        onClick={onClear}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(220,225,240,0.5)',
          cursor: 'pointer',
          fontSize: '1.1rem',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

function SlideDrawer({
  children,
  onClose,
  width = 380,
  accentColor,
}: {
  children: React.ReactNode
  onClose: () => void
  width?: number
  accentColor?: string
}) {
  return (
    <div
      style={{
        width,
        flexShrink: 0,
        borderLeft: `1px solid ${accentColor ?? 'rgba(120,150,210,0.12)'}`,
        background: '#0A1226',
        display: 'flex',
        flexDirection: 'column',
        animation: 'sidePanelIn 0.22s ease-out',
        overflowY: 'auto',
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      {children}
    </div>
  )
}

function RecCard({
  rec,
  onCreateNote,
}: {
  rec: Recommendation
  onCreateNote: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const categoryColor =
    rec.category === 'next-step'
      ? '#7EE8A2'
      : rec.category === 'adjacent'
        ? '#60a5fa'
        : '#fbbf24'
  const categoryLabel =
    rec.category === 'next-step'
      ? 'Next step'
      : rec.category === 'adjacent'
        ? 'You might also like'
        : 'Foundational'
  const diffLabel =
    rec.difficulty === 'easy' ? 'Easy' : rec.difficulty === 'medium' ? 'Medium' : 'Hard'

  return (
    <button
      onClick={onCreateNote}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click to start a note on this topic"
      style={{
        minWidth: 290,
        maxWidth: 340,
        flexShrink: 0,
        padding: '1.1rem 1.15rem',
        background: hovered ? 'rgba(120,150,210,0.1)' : 'rgba(120,150,210,0.04)',
        borderTop: `1px solid ${hovered ? categoryColor : 'rgba(120,150,210,0.18)'}`,
        borderRight: `1px solid ${hovered ? categoryColor : 'rgba(120,150,210,0.18)'}`,
        borderBottom: `1px solid ${hovered ? categoryColor : 'rgba(120,150,210,0.18)'}`,
        borderLeft: `4px solid ${categoryColor}`,
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        textAlign: 'left',
        color: 'inherit',
        fontFamily: 'inherit',
        boxShadow: hovered ? `0 10px 24px ${categoryColor}26` : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: categoryColor,
            fontWeight: 700,
            fontFamily: 'var(--font-syne, system-ui), sans-serif',
          }}
        >
          {categoryLabel}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            color: 'rgba(220,225,240,0.55)',
            letterSpacing: '0.06em',
            background: 'rgba(120,150,210,0.08)',
            border: '1px solid rgba(120,150,210,0.15)',
            padding: '0.15rem 0.5rem',
            borderRadius: 99,
            fontWeight: 500,
          }}
        >
          {diffLabel}
        </span>
      </div>
      <div
        style={{
          fontSize: '1.1rem',
          color: '#f1f4ff',
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        }}
      >
        {rec.topic}
      </div>
      <div
        style={{
          fontSize: '0.92rem',
          color: 'rgba(220,225,240,0.7)',
          lineHeight: 1.5,
        }}
      >
        {rec.why}
      </div>
      {rec.builds_on && rec.builds_on.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            flexWrap: 'wrap',
          }}
        >
          {rec.builds_on.slice(0, 2).map((b) => (
            <span
              key={b}
              style={{
                fontSize: '0.78rem',
                padding: '0.2rem 0.55rem',
                borderRadius: 99,
                background: 'rgba(10,18,38,0.7)',
                color: 'rgba(220,225,240,0.6)',
                border: '1px solid rgba(120,150,210,0.18)',
                fontFamily: 'var(--font-dm-mono, ui-monospace), monospace',
              }}
            >
              {b.length > 28 ? b.slice(0, 26) + '…' : b}
            </span>
          ))}
        </div>
      )}
      <div
        style={{
          marginTop: 'auto',
          fontSize: '0.85rem',
          color: hovered ? categoryColor : 'rgba(220,225,240,0.45)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          transition: 'color 0.15s',
          paddingTop: '0.25rem',
        }}
      >
        Start a note
        <span style={{ transform: hovered ? 'translateX(3px)' : 'none', transition: 'transform 0.18s' }}>
          →
        </span>
      </div>
    </button>
  )
}
