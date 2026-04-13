'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotes } from '@/lib/NotesContext'
import { useLinks } from '@/lib/LinksContext'
import ForestCanvas, { GraphNode, GraphEdge } from '@/components/app/ForestCanvas'

const UNLOCK_THRESHOLD = 3

type SubCluster = { id: string; noteIds: string[]; label: string }

export default function ForestPage() {
  const router = useRouter()
  const { notes } = useNotes()
  const { confirmedLinks } = useLinks()

  const [highlightedIds, setHighlightedIds] = useState<string[]>([])
  const [subClusters, setSubClusters] = useState<SubCluster[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isPartitioning, setIsPartitioning] = useState(true)
  const partitionKeyRef = useRef('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('notework_conflict_highlight')
      if (stored) {
        setHighlightedIds(JSON.parse(stored))
        localStorage.removeItem('notework_conflict_highlight')
      }
    } catch {}
  }, [])

  // Union-find: group all transitively connected notes
  const connectedComponents = useMemo(() => {
    const parent: Record<string, string> = {}
    const allIds = [...new Set(confirmedLinks.flatMap((l) => [l.sourceNoteId, l.targetNoteId]))]
    allIds.forEach((id) => { parent[id] = id })
    function find(x: string): string {
      if (parent[x] !== x) parent[x] = find(parent[x])
      return parent[x]
    }
    confirmedLinks.forEach((l) => {
      const pa = find(l.sourceNoteId), pb = find(l.targetNoteId)
      if (pa !== pb) parent[pa] = pb
    })
    const groups: Record<string, string[]> = {}
    allIds.forEach((id) => {
      const root = find(id)
      if (!groups[root]) groups[root] = []
      groups[root].push(id)
    })
    return Object.values(groups)
  }, [confirmedLinks])

  // Partition each connected component into semantic sub-clusters via AI
  useEffect(() => {
    const noteMap = Object.fromEntries(notes.map((n) => [n.id, n]))
    // Stable key: sorted component IDs
    const key = connectedComponents.map((c) => [...c].sort().join(',')).sort().join('|')
    if (key === partitionKeyRef.current) return
    partitionKeyRef.current = key

    if (connectedComponents.length === 0) { setSubClusters([]); setIsPartitioning(false); return }
    setIsPartitioning(true)

    let cancelled = false
    let scId = 0

    Promise.all(
      connectedComponents.map(async (component) => {
        const ns = component.map((id) => noteMap[id]).filter(Boolean)
        try {
          const res = await fetch('/api/cluster-partition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: ns.map((n) => ({ id: n.id, title: n.title, content: n.content })) }),
          })
          const data = await res.json()
          return (data.clusters ?? []).map((c: { noteIds: string[]; label: string }) => ({
            id: `sc-${scId++}`,
            noteIds: c.noteIds,
            label: c.label,
          })) as SubCluster[]
        } catch {
          return [{ id: `sc-${scId++}`, noteIds: component, label: 'Related Notes' }] as SubCluster[]
        }
      })
    ).then((results) => {
      if (!cancelled) { setSubClusters(results.flat()); setIsPartitioning(false) }
    })

    return () => { cancelled = true }
  }, [connectedComponents, notes])

  const noteMap = useMemo(() => Object.fromEntries(notes.map((n) => [n.id, n])), [notes])

  // Which notes are "visible" (in an expanded sub-cluster)
  const expandedNoteIds = useMemo(() => {
    const s = new Set<string>()
    subClusters.forEach((sc) => {
      if (expandedIds.has(sc.id)) sc.noteIds.forEach((id) => s.add(id))
    })
    return s
  }, [subClusters, expandedIds])

  // Build display nodes
  const displayNodes = useMemo((): GraphNode[] => {
    const nodes: GraphNode[] = []
    for (const sc of subClusters) {
      if (expandedIds.has(sc.id)) {
        // Expanded: show individual note nodes
        sc.noteIds.forEach((id) => {
          const note = noteMap[id]
          if (!note) return
          const linkCount = confirmedLinks.filter(
            (l) => l.sourceNoteId === id || l.targetNoteId === id
          ).length
          nodes.push({
            id,
            type: 'note',
            label: note.title || 'Untitled',
            x: 0, y: 0, vx: 0, vy: 0,
            radius: 22 + Math.min(linkCount * 2, 10),
          })
        })
      } else {
        // Collapsed: one hub node
        nodes.push({
          id: sc.id,
          type: 'cluster',
          label: sc.label,
          noteCount: sc.noteIds.length,
          x: 0, y: 0, vx: 0, vy: 0,
          radius: 40 + Math.min(sc.noteIds.length * 4, 20),
        })
      }
    }
    return nodes
  }, [subClusters, expandedIds, noteMap, confirmedLinks])

  // Build display edges
  const displayEdges = useMemo((): GraphEdge[] => {
    const displayNodeIds = new Set(displayNodes.map((n) => n.id))
    const edges: GraphEdge[] = []

    // Edges between expanded note nodes
    confirmedLinks.forEach((l) => {
      if (expandedNoteIds.has(l.sourceNoteId) && expandedNoteIds.has(l.targetNoteId)) {
        edges.push({ source: l.sourceNoteId, target: l.targetNoteId, reason: l.reason })
      }
    })

    // Edges between cluster hubs (or hub ↔ note) when notes in different sub-clusters are linked
    const noteToSubCluster = new Map<string, string>()
    subClusters.forEach((sc) => sc.noteIds.forEach((id) => noteToSubCluster.set(id, sc.id)))

    const hubEdgeSet = new Set<string>()
    confirmedLinks.forEach((l) => {
      const srcCluster = noteToSubCluster.get(l.sourceNoteId)
      const tgtCluster = noteToSubCluster.get(l.targetNoteId)
      if (!srcCluster || !tgtCluster || srcCluster === tgtCluster) return

      // Resolve the display ID for each end
      const srcId = expandedIds.has(srcCluster) ? l.sourceNoteId : srcCluster
      const tgtId = expandedIds.has(tgtCluster) ? l.targetNoteId : tgtCluster

      if (!displayNodeIds.has(srcId) || !displayNodeIds.has(tgtId)) return
      if (srcId === tgtId) return

      const key = [srcId, tgtId].sort().join('||')
      if (!hubEdgeSet.has(key)) {
        hubEdgeSet.add(key)
        edges.push({ source: srcId, target: tgtId, reason: l.reason })
      }
    })

    return edges
  }, [confirmedLinks, expandedNoteIds, expandedIds, subClusters, displayNodes])

  function handleNodeClick(nodeId: string, type: 'note' | 'cluster') {
    if (type === 'cluster') {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId)
        return next
      })
    } else {
      try { localStorage.setItem('notework_selected_note', nodeId) } catch {}
      router.push('/app')
    }
  }

  // Locked state
  if (confirmedLinks.length < UNLOCK_THRESHOLD) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: '#0D0D0B',
          color: 'rgba(181,179,172,0.5)',
          fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, stroke: 'rgba(181,179,172,0.35)', fill: 'none', strokeWidth: 1.2 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p style={{ fontSize: '0.95rem' }}>
          Forest View unlocks after {UNLOCK_THRESHOLD} confirmed connections
        </p>
        <p style={{ fontSize: '0.82rem', color: 'rgba(181,179,172,0.35)' }}>
          {confirmedLinks.length} / {UNLOCK_THRESHOLD} so far
        </p>
        <Link href="/app" style={{ marginTop: '0.5rem', color: '#5CB87A', fontSize: '0.82rem', textDecoration: 'none' }}>
          ← Back to notes
        </Link>
      </div>
    )
  }

  const hubCount = displayNodes.filter((n) => n.type === 'cluster').length
  const noteCount = displayNodes.filter((n) => n.type === 'note').length

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0D0D0B',
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
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          background: 'rgba(13,13,11,0.9)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link
          href="/app"
          style={{ color: 'rgba(181,179,172,0.5)', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          ← Back
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', fontSize: '0.95rem', color: '#F0EEE8', letterSpacing: '-0.01em' }}>
            Note<span style={{ color: '#5CB87A' }}>work</span>
          </span>
          <span style={{ color: 'rgba(181,179,172,0.25)', fontSize: '0.75rem' }}>Forest</span>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'rgba(181,179,172,0.3)', display: 'flex', gap: '0.75rem' }}>
          {hubCount > 0 && <span>{hubCount} cluster{hubCount !== 1 ? 's' : ''}</span>}
          {noteCount > 0 && <span>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>}
          <span>{displayEdges.length} link{displayEdges.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {isPartitioning ? (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(92,184,122,0.5)', fontSize: '0.82rem', gap: '0.5rem',
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2, animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            Mapping your knowledge…
          </div>
        ) : displayNodes.length === 0 ? (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem', color: 'rgba(181,179,172,0.35)',
            }}
          >
            <p style={{ fontSize: '0.88rem' }}>No connected notes yet.</p>
            <button
              onClick={() => router.push('/app')}
              style={{ color: '#5CB87A', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Confirm some connections →
            </button>
          </div>
        ) : (
          <ForestCanvas
            nodes={displayNodes}
            edges={displayEdges}
            onNodeClick={handleNodeClick}
            highlightedNodeIds={highlightedIds}
          />
        )}

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.45rem 1rem',
            background: 'rgba(12,12,10,0.82)',
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: 100,
            backdropFilter: 'blur(10px)',
            whiteSpace: 'nowrap',
          }}
        >
          <LegendItem dashed label="Cluster — click to expand" />
          <LegendItem label="Note — click to open" />
          <span style={{ fontSize: '0.66rem', color: 'rgba(181,179,172,0.32)' }}>
            scroll · zoom &nbsp;·&nbsp; drag · pan
          </span>
        </div>
      </div>
    </div>
  )
}

function LegendItem({ label, dashed }: { label: string; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem' }}>
      <div
        style={{
          width: 11,
          height: 11,
          borderRadius: '50%',
          background: dashed ? 'rgba(45,90,61,0.45)' : '#1E3228',
          border: `1.5px ${dashed ? 'dashed' : 'solid'} rgba(92,184,122,0.5)`,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: '0.66rem', color: 'rgba(181,179,172,0.48)' }}>{label}</span>
    </div>
  )
}
