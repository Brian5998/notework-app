'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  forceSimulation,
  forceCenter,
  forceLink,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { CLUSTER_COLORS, type ClusterColorKey } from '@/lib/clusterColors'

// ── Public types ─────────────────────────────────────────────────────────────

export type BubbleData = {
  id: string
  label: string
  noteIds: string[]
  noteCount: number
  colorKey: ClusterColorKey
}

export type BubbleNoteData = {
  id: string
  bubbleId: string
  label: string
  connectionCount: number
  createdAt: string
}

export type BubbleEdgeData = {
  source: string // note id
  target: string // note id
  reason: string
  confirmed: boolean
  strength?: number // 0..1, drives stroke weight
  // Part 3B: contradictions render in red w/ ⚡
  contradiction?: { key: string }
}

// Part 3D: ghost nodes for AI-suggested concept gaps. Optional, rendered
// over the simulation but not part of physics.
export type GhostNodeData = {
  id: string
  concept: string
  // ids of nearby bubbles — ghost is positioned at the average of their centers
  nearbyBubbleIds: string[]
}

type Props = {
  bubbles: BubbleData[]
  notes: BubbleNoteData[]
  edges: BubbleEdgeData[]
  onNodeClick: (id: string, type: 'note' | 'bubble', shiftKey: boolean) => void
  onNodeHover?: (id: string | null, type: 'note' | 'bubble' | null) => void
  onContradictionClick?: (key: string) => void
  onGhostClick?: (concept: string) => void
  highlightedNodeIds?: string[]
  // Part 3A
  heatmapEnabled?: boolean
  densities?: Record<string, number>
  // Part 3D
  ghosts?: GhostNodeData[]
  // Part 3E — list of node ids forming the highlighted path (in order)
  highlightedPath?: string[]
  // Part 3C — note ids that are "current" (others fade)
  visibleNoteIds?: Set<string>
}

// ── Internal physics types ───────────────────────────────────────────────────

type SimBubble = SimulationNodeDatum & {
  _kind: 'bubble'
  id: string
  label: string
  noteIds: string[]
  noteCount: number
  colorKey: ClusterColorKey
  radius: number
}

type SimNote = SimulationNodeDatum & {
  _kind: 'note'
  id: string
  bubbleId: string
  label: string
  connectionCount: number
  createdAt: string
  radius: number
}

type SimNode = SimBubble | SimNote

// ── Constants ────────────────────────────────────────────────────────────────

const BG_COLOR = '#050a18'
const GRID_COLOR = 'rgba(120,150,210,0.045)'

const NOTE_R_BASE = 32
const NOTE_R_PER_LINK = 2.6
const NOTE_R_MAX = 50

function bubbleRadiusForCount(n: number): number {
  // Parent size — bumped up to accommodate the larger note nodes inside.
  // 3 notes ≈ 142, 5 notes ≈ 160, 8 notes ≈ 182, 16 ≈ 224
  return Math.max(95, 70 + Math.sqrt(n) * 38)
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BubbleForestCanvas({
  bubbles,
  notes,
  edges,
  onNodeClick,
  onNodeHover,
  onContradictionClick,
  onGhostClick,
  highlightedNodeIds,
  heatmapEnabled,
  densities,
  ghosts,
  highlightedPath,
  visibleNoteIds,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null)
  const bubblesRef = useRef<SimBubble[]>([])
  const notesRef = useRef<SimNote[]>([])
  const edgesRef = useRef<BubbleEdgeData[]>([])
  const ghostsRef = useRef<GhostNodeData[]>([])
  const ghostPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

  const hoveredRef = useRef<{ id: string; type: 'note' | 'bubble' } | null>(null)
  const hoveredEdgeRef = useRef<BubbleEdgeData | null>(null)
  const hoveredContradictionRef = useRef<string | null>(null)
  const hoveredGhostRef = useRef<string | null>(null)
  const tooltipRef = useRef({ x: 0, y: 0 })
  const highlightedRef = useRef<Set<string>>(new Set())
  const highlightedPathRef = useRef<string[]>([])
  const visibleNotesRef = useRef<Set<string> | null>(null)
  const heatmapRef = useRef<{ enabled: boolean; densities: Record<string, number> }>({
    enabled: false,
    densities: {},
  })

  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const panningRef = useRef(false)
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const rafRef = useRef(0)
  const prevSigRef = useRef('')

  // ── Update prop refs ───────────────────────────────────────────────────────
  useEffect(() => {
    highlightedRef.current = new Set(highlightedNodeIds ?? [])
  }, [highlightedNodeIds])

  useEffect(() => {
    highlightedPathRef.current = highlightedPath ?? []
  }, [highlightedPath])

  useEffect(() => {
    visibleNotesRef.current = visibleNoteIds ?? null
  }, [visibleNoteIds])

  useEffect(() => {
    heatmapRef.current = {
      enabled: !!heatmapEnabled,
      densities: densities ?? {},
    }
  }, [heatmapEnabled, densities])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  useEffect(() => {
    ghostsRef.current = ghosts ?? []
    // ghost positions are derived from bubble centers, recomputed on each frame
  }, [ghosts])

  // ── Build / rebuild the simulation when topology changes ──────────────────
  useEffect(() => {
    // Topology signature includes edges so we recompute bubble↔bubble link
    // forces when edges shift (otherwise newly-connected clusters wouldn't
    // pull together).
    const sig =
      bubbles
        .map((b) => `${b.id}:${b.noteIds.length}:${b.colorKey}`)
        .sort()
        .join('|') +
      '||' +
      notes
        .map((n) => `${n.id}:${n.bubbleId}`)
        .sort()
        .join('|') +
      '||' +
      edges
        .filter((e) => e.confirmed)
        .map((e) => [e.source, e.target].sort().join('-'))
        .sort()
        .join(',')

    if (sig === prevSigRef.current && simRef.current) return
    const isFirstBuild = prevSigRef.current === ''
    prevSigRef.current = sig

    const canvas = canvasRef.current
    const W = canvas?.offsetWidth ?? 800
    const H = canvas?.offsetHeight ?? 600

    // Preserve existing positions
    const existingBubbles = new Map(bubblesRef.current.map((b) => [b.id, b]))
    const existingNotes = new Map(notesRef.current.map((n) => [n.id, n]))

    const simBubbles: SimBubble[] = bubbles.map((b, i) => {
      const ex = existingBubbles.get(b.id)
      const angle = (i / Math.max(bubbles.length, 1)) * Math.PI * 2
      const ringR = Math.min(W, H) * 0.28
      return {
        _kind: 'bubble',
        id: b.id,
        label: b.label,
        noteIds: b.noteIds,
        noteCount: b.noteCount,
        colorKey: b.colorKey,
        radius: bubbleRadiusForCount(b.noteCount),
        x: ex?.x ?? Math.cos(angle) * ringR,
        y: ex?.y ?? Math.sin(angle) * ringR,
        vx: ex?.vx ?? 0,
        vy: ex?.vy ?? 0,
      }
    })
    const bubbleById = new Map(simBubbles.map((b) => [b.id, b]))

    // Deterministic initial spread — notes start arranged around their
    // bubble center on a regular polygon, so even brand-new bubbles never
    // start with stacked nodes. Subsequent ticks let physics take over.
    const noteIndexInBubble: Record<string, number> = {}
    const simNotes: SimNote[] = notes.map((n) => {
      const ex = existingNotes.get(n.id)
      const parent = bubbleById.get(n.bubbleId)
      const cx = parent?.x ?? 0
      const cy = parent?.y ?? 0
      const r = parent?.radius ?? 100
      const idx = (noteIndexInBubble[n.bubbleId] =
        (noteIndexInBubble[n.bubbleId] ?? -1) + 1)
      const siblings = bubbles.find((b) => b.id === n.bubbleId)?.noteCount ?? 1
      const ang =
        (idx / Math.max(siblings, 1)) * Math.PI * 2 +
        Math.PI / 4 // small offset so positions don't align with bubble label
      const dist = r * 0.45
      const radius = Math.min(
        NOTE_R_MAX,
        NOTE_R_BASE + Math.min(n.connectionCount, 6) * NOTE_R_PER_LINK,
      )
      return {
        _kind: 'note',
        id: n.id,
        bubbleId: n.bubbleId,
        label: n.label,
        connectionCount: n.connectionCount,
        createdAt: n.createdAt,
        radius,
        x: ex?.x ?? cx + Math.cos(ang) * dist,
        y: ex?.y ?? cy + Math.sin(ang) * dist,
        vx: ex?.vx ?? 0,
        vy: ex?.vy ?? 0,
      }
    })

    bubblesRef.current = simBubbles
    notesRef.current = simNotes

    // ── Containment force ───────────────────────────────────────────────────
    // Pulls each note toward its parent bubble, then hard-clamps to the
    // bubble's interior. Tripled the prior strength because the kind-aware
    // collide below no longer fights it.
    const containmentForce = () => {
      const force = (alpha: number) => {
        const bubMap = new Map<string, SimBubble>()
        for (const b of simBubbles) bubMap.set(b.id, b)
        for (const n of simNotes) {
          const b = bubMap.get(n.bubbleId)
          if (!b || b.x == null || b.y == null || n.x == null || n.y == null) continue
          // Strong pull toward bubble center
          n.vx = (n.vx ?? 0) + (b.x - n.x) * alpha * 0.55
          n.vy = (n.vy ?? 0) + (b.y - n.y) * alpha * 0.55
          // Hard clamp — never escape the bubble
          const dx = n.x - b.x
          const dy = n.y - b.y
          const d = Math.hypot(dx, dy)
          const inner = Math.max(0, b.radius - n.radius - 6)
          if (d > inner && d > 0) {
            const k = inner / d
            n.x = b.x + dx * k
            n.y = b.y + dy * k
            n.vx = (n.vx ?? 0) * 0.35
            n.vy = (n.vy ?? 0) * 0.35
          }
        }
      }
      ;(force as unknown as { initialize: () => void }).initialize = () => {}
      return force as unknown as (alpha: number) => void
    }

    // ── Kind-aware collide ──────────────────────────────────────────────────
    // CRITICAL: d3-force's stock forceCollide runs between EVERY pair of
    // nodes. That meant a bubble was constantly colliding with every note
    // inside it (since the note's position is by definition inside the
    // bubble's collision radius), launching bubbles outward every tick. This
    // custom force only collides bubble↔bubble and note↔sibling-note.
    //
    // We run multiple Jacobi iterations per tick (like d3-force does) so
    // overlaps actually fully resolve instead of just dampening over many
    // ticks — this is what stops sibling notes from looking stacked.
    const kindCollideForce = () => {
      const BUBBLE_PAD = 28
      const NOTE_PAD = 8
      const NOTE_ITERATIONS = 4

      const resolvePair = (a: SimNode, b: SimNode, minD: number) => {
        if (a.x == null || a.y == null || b.x == null || b.y == null) return
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d2 = dx * dx + dy * dy
        if (d2 >= minD * minD) return
        let d = Math.sqrt(d2)
        let ux: number, uy: number
        if (d < 0.001) {
          // Two nodes exactly stacked — push them apart along a stable axis
          const angle = (a.x * 7919 + a.y * 6571) % (Math.PI * 2)
          ux = Math.cos(angle)
          uy = Math.sin(angle)
          d = 0.001
        } else {
          ux = dx / d
          uy = dy / d
        }
        const overlap = (minD - d) * 0.5
        a.x -= ux * overlap
        a.y -= uy * overlap
        b.x += ux * overlap
        b.y += uy * overlap
      }

      const force = () => {
        // Bubble ↔ Bubble (one pass — bubbles never start stacked)
        for (let i = 0; i < simBubbles.length; i++) {
          const a = simBubbles[i]
          for (let j = i + 1; j < simBubbles.length; j++) {
            const b = simBubbles[j]
            resolvePair(a, b, a.radius + b.radius + BUBBLE_PAD * 2)
          }
        }
        // Note ↔ Sibling Note — bucket by parent bubble first
        const byBubble = new Map<string, SimNote[]>()
        for (const n of simNotes) {
          let arr = byBubble.get(n.bubbleId)
          if (!arr) {
            arr = []
            byBubble.set(n.bubbleId, arr)
          }
          arr.push(n)
        }
        // Multi-iteration Jacobi relaxation for sibling notes — ensures
        // that even if 3+ notes started in the same spot, they fully spread
        for (let iter = 0; iter < NOTE_ITERATIONS; iter++) {
          for (const arr of byBubble.values()) {
            if (arr.length < 2) continue
            for (let i = 0; i < arr.length; i++) {
              const a = arr[i]
              for (let j = i + 1; j < arr.length; j++) {
                const b = arr[j]
                resolvePair(a, b, a.radius + b.radius + NOTE_PAD * 2)
              }
            }
          }
        }
      }
      ;(force as unknown as { initialize: () => void }).initialize = () => {}
      return force as unknown as (alpha: number) => void
    }

    // ── Kind-aware charge (Coulomb-style repulsion) ─────────────────────────
    // Same fix as collide, but for the inverse-square repulsion. Bubbles
    // repel each other; sibling notes repel each other (so they spread out
    // inside their bubble); nothing else.
    const kindChargeForce = () => {
      const BUBBLE_K = 1500 // repulsion magnitude — tuned so bubbles space
      // out without overpowering link/center forces
      const NOTE_SIBLING_K = 280
      const BUBBLE_MAX_DIST = 900
      const NOTE_MAX_DIST = 220
      const force = (alpha: number) => {
        // Bubble ↔ Bubble
        for (let i = 0; i < simBubbles.length; i++) {
          const a = simBubbles[i]
          if (a.x == null || a.y == null) continue
          for (let j = i + 1; j < simBubbles.length; j++) {
            const b = simBubbles[j]
            if (b.x == null || b.y == null) continue
            const dx = b.x - a.x
            const dy = b.y - a.y
            const d2 = dx * dx + dy * dy
            if (d2 > BUBBLE_MAX_DIST * BUBBLE_MAX_DIST) continue
            const d = Math.sqrt(d2) || 0.01
            const mag = (BUBBLE_K * alpha) / Math.max(d2, 100)
            const fx = (mag * dx) / d
            const fy = (mag * dy) / d
            a.vx = (a.vx ?? 0) - fx
            a.vy = (a.vy ?? 0) - fy
            b.vx = (b.vx ?? 0) + fx
            b.vy = (b.vy ?? 0) + fy
          }
        }
        // Note ↔ Sibling Note
        const byBubble = new Map<string, SimNote[]>()
        for (const n of simNotes) {
          let arr = byBubble.get(n.bubbleId)
          if (!arr) {
            arr = []
            byBubble.set(n.bubbleId, arr)
          }
          arr.push(n)
        }
        for (const arr of byBubble.values()) {
          for (let i = 0; i < arr.length; i++) {
            const a = arr[i]
            if (a.x == null || a.y == null) continue
            for (let j = i + 1; j < arr.length; j++) {
              const b = arr[j]
              if (b.x == null || b.y == null) continue
              const dx = b.x - a.x
              const dy = b.y - a.y
              const d2 = dx * dx + dy * dy
              if (d2 > NOTE_MAX_DIST * NOTE_MAX_DIST) continue
              const d = Math.sqrt(d2) || 0.01
              const mag = (NOTE_SIBLING_K * alpha) / Math.max(d2, 25)
              const fx = (mag * dx) / d
              const fy = (mag * dy) / d
              a.vx = (a.vx ?? 0) - fx
              a.vy = (a.vy ?? 0) - fy
              b.vx = (b.vx ?? 0) + fx
              b.vy = (b.vy ?? 0) + fy
            }
          }
        }
      }
      ;(force as unknown as { initialize: () => void }).initialize = () => {}
      return force as unknown as (alpha: number) => void
    }

    if (simRef.current) simRef.current.stop()

    const allNodes: SimNode[] = [...simBubbles, ...simNotes]

    // Bounds clamp force — keeps everything inside a sensible play area so
    // bubbles can't drift off into the abyss when topology shrinks/grows.
    // Computed from canvas size so it scales with viewport.
    const halfW = Math.max(W, 600) / 2 + 200
    const halfH = Math.max(H, 400) / 2 + 200
    const boundsForce = () => {
      const force = () => {
        for (const n of allNodes) {
          // NaN guard — recover gracefully if physics ever blows up
          if (n.x == null || !Number.isFinite(n.x)) {
            n.x = (Math.random() - 0.5) * halfW
            n.vx = 0
          }
          if (n.y == null || !Number.isFinite(n.y)) {
            n.y = (Math.random() - 0.5) * halfH
            n.vy = 0
          }
          if (n.vx != null && !Number.isFinite(n.vx)) n.vx = 0
          if (n.vy != null && !Number.isFinite(n.vy)) n.vy = 0
          if (n.x > halfW) {
            n.x = halfW
            n.vx = Math.min(n.vx ?? 0, 0)
          } else if (n.x < -halfW) {
            n.x = -halfW
            n.vx = Math.max(n.vx ?? 0, 0)
          }
          if (n.y > halfH) {
            n.y = halfH
            n.vy = Math.min(n.vy ?? 0, 0)
          } else if (n.y < -halfH) {
            n.y = -halfH
            n.vy = Math.max(n.vy ?? 0, 0)
          }
        }
      }
      ;(force as unknown as { initialize: () => void }).initialize = () => {}
      return force as unknown as (alpha: number) => void
    }

    // ── Inter-bubble link force ─────────────────────────────────────────────
    // Compute one link per pair of bubbles connected by ≥1 confirmed edge.
    // Distance shrinks as the number of cross-cluster connections grows
    // (more shared concepts → tighter coupling), with strength capped so
    // the force never overwhelms collision.
    const noteToBubble = new Map<string, string>()
    for (const sn of simNotes) noteToBubble.set(sn.id, sn.bubbleId)

    type BubbleLink = SimulationLinkDatum<SimBubble> & {
      source: string | SimBubble
      target: string | SimBubble
      count: number
    }
    const pairCounts = new Map<string, number>()
    for (const e of edges) {
      if (!e.confirmed) continue
      const aB = noteToBubble.get(e.source)
      const bB = noteToBubble.get(e.target)
      if (!aB || !bB || aB === bB) continue
      const key = [aB, bB].sort().join('||')
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
    }
    const bubbleLinks: BubbleLink[] = [...pairCounts.entries()].map(
      ([key, count]) => {
        const [a, b] = key.split('||')
        return { source: a, target: b, count }
      },
    )

    if (simRef.current) simRef.current.stop()

    const sim = forceSimulation<SimNode>(allNodes)
      .alpha(isFirstBuild ? 1 : 0.55)
      .alphaDecay(0.035)
      // alphaMin > default so the sim actually halts and stops drifting
      .alphaMin(0.025)
      .velocityDecay(0.55)
      // Kind-aware forces — bubbles only interact with bubbles, sibling
      // notes only interact with each other. This is the actual fix.
      .force('charge', kindChargeForce())
      .force('collide', kindCollideForce())
      // Link force between bubbles that share confirmed cross-cluster edges
      .force(
        'bubbleLinks',
        forceLink<SimNode, BubbleLink>(bubbleLinks)
          .id((d) => d.id)
          .distance((l) => {
            const a = bubbleById.get(
              typeof l.source === 'string' ? l.source : l.source.id,
            )
            const b = bubbleById.get(
              typeof l.target === 'string' ? l.target : l.target.id,
            )
            const base = (a?.radius ?? 100) + (b?.radius ?? 100) + 80
            return Math.max(150, base / Math.sqrt(l.count))
          })
          .strength((l) => Math.min(0.85, 0.32 + l.count * 0.12)),
      )
      // Strong center + gravity so disconnected bubbles never drift away
      .force('center', forceCenter(0, 0).strength(0.12))
      .force(
        'gravityX',
        forceX<SimNode>(0).strength((d) => (d._kind === 'bubble' ? 0.08 : 0)),
      )
      .force(
        'gravityY',
        forceY<SimNode>(0).strength((d) => (d._kind === 'bubble' ? 0.08 : 0)),
      )
      // Containment runs LAST so its hard-clamp overrides any leftover
      // misalignment between notes and bubbles.
      .force('contain', containmentForce())
      .force('bounds', boundsForce())

    sim.on('tick', () => {
      // physics is updating bubblesRef / notesRef in place
    })

    simRef.current = sim
  }, [bubbles, notes, edges])

  // ── Continuous draw loop (always running for animations) ──────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      rafRef.current = requestAnimationFrame(draw)
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      rafRef.current = requestAnimationFrame(draw)
      return
    }

    const W = canvas.width
    const H = canvas.height
    const now = Date.now()

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.translate(panRef.current.x, panRef.current.y)
    ctx.scale(zoomRef.current, zoomRef.current)

    // Subtle grid in screen space
    {
      const gs = 56
      const z = zoomRef.current
      const sx = Math.floor(-panRef.current.x / z / gs - 1) * gs
      const sy = Math.floor(-panRef.current.y / z / gs - 1) * gs
      const ex = sx + W / z + gs * 2
      const ey = sy + H / z + gs * 2
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 1 / z
      ctx.beginPath()
      for (let gx = sx; gx < ex; gx += gs) {
        ctx.moveTo(gx, sy)
        ctx.lineTo(gx, ey)
      }
      for (let gy = sy; gy < ey; gy += gs) {
        ctx.moveTo(sx, gy)
        ctx.lineTo(ex, gy)
      }
      ctx.stroke()
    }

    const noteMap = new Map<string, SimNote>()
    for (const n of notesRef.current) noteMap.set(n.id, n)
    const bubbleMap = new Map<string, SimBubble>()
    for (const b of bubblesRef.current) bubbleMap.set(b.id, b)

    // Recompute ghost positions from current bubble positions
    ghostPositionsRef.current.clear()
    for (const g of ghostsRef.current) {
      const parents = g.nearbyBubbleIds
        .map((id) => bubbleMap.get(id))
        .filter((b): b is SimBubble => !!b && b.x != null && b.y != null)
      if (parents.length === 0) continue
      let sx = 0,
        sy = 0
      for (const p of parents) {
        sx += p.x ?? 0
        sy += p.y ?? 0
      }
      ghostPositionsRef.current.set(g.id, {
        x: sx / parents.length,
        y: sy / parents.length,
      })
    }

    // Determine which note ids are currently visible (Part 3C time scrubber)
    const visibleSet = visibleNotesRef.current
    const isNoteVisible = (id: string) => !visibleSet || visibleSet.has(id)

    // ── Bubbles (low-opacity fills + glowing border w/ pulse) ───────────────
    // Pulse phase (3s period as spec'd)
    const pulse = 0.5 + 0.5 * Math.sin((now * 2 * Math.PI) / 3000)

    for (const b of bubblesRef.current) {
      if (b.x == null || b.y == null) continue
      const palette = CLUSTER_COLORS[b.colorKey] ?? CLUSTER_COLORS.unassigned
      const isHover =
        hoveredRef.current?.type === 'bubble' && hoveredRef.current.id === b.id

      // Ambient glow ring (offscreen-ish gradient — cheaper than shadowBlur)
      const glowR = b.radius * 1.55
      const grad = ctx.createRadialGradient(b.x, b.y, b.radius * 0.85, b.x, b.y, glowR)
      grad.addColorStop(0, palette.glow.replace(/[\d.]+\)/, `${0.18 + pulse * 0.12})`))
      grad.addColorStop(1, palette.glow.replace(/[\d.]+\)/, '0)'))
      ctx.beginPath()
      ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Bubble body
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
      ctx.fillStyle = palette.fill
      ctx.fill()

      // Heatmap radial overlay (Part 3A)
      if (heatmapRef.current.enabled) {
        const density = heatmapRef.current.densities[b.id] ?? 0
        // Warm if dense, cool if sparse
        const warm = `rgba(245,158,11,${0.42 * density})`
        const cool = `rgba(96,165,250,${0.28 * (1 - density)})`
        const center = density > 0.3 ? warm : cool
        const heatGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius)
        heatGrad.addColorStop(0, center)
        heatGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
        ctx.fillStyle = heatGrad
        ctx.fill()
      }

      // Border + glow (use shadowBlur for the glow itself — once per bubble)
      ctx.save()
      ctx.shadowBlur = (10 + pulse * 8) * (isHover ? 1.4 : 1)
      ctx.shadowColor = palette.glow
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
      ctx.strokeStyle = palette.border
      ctx.globalAlpha = isHover ? 0.95 : 0.6 + pulse * 0.25
      ctx.lineWidth = (isHover ? 2.2 : 1.5) / zoomRef.current
      ctx.stroke()
      ctx.restore()

      // Label at top of bubble — bumped from 13px to 18px and weight 700
      ctx.font = `700 ${Math.max(15, 18 / zoomRef.current)}px var(--font-syne, system-ui, sans-serif)`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = palette.border
      ctx.globalAlpha = isHover ? 1 : 0.95
      const labelY = b.y - b.radius - 12 / zoomRef.current
      ctx.fillText(b.label, b.x, labelY)
      ctx.globalAlpha = 1

      // Note count badge — also bumped
      ctx.font = `500 ${Math.max(11, 12 / zoomRef.current)}px var(--font-dm-mono, ui-monospace, monospace)`
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.fillText(
        `${b.noteCount} note${b.noteCount !== 1 ? 's' : ''}`,
        b.x,
        labelY - 18 / zoomRef.current,
      )
    }

    // ── Edges (curved bezier between note nodes) ────────────────────────────
    for (const e of edgesRef.current) {
      const a = noteMap.get(e.source)
      const b = noteMap.get(e.target)
      if (!a || !b || a.x == null || a.y == null || b.x == null || b.y == null) continue

      const aVis = isNoteVisible(a.id)
      const bVis = isNoteVisible(b.id)
      if (!aVis || !bVis) {
        ctx.globalAlpha = 0.08
      }

      const isContradiction = !!e.contradiction
      const isPath =
        highlightedPathRef.current.length >= 2 &&
        edgeOnPath(highlightedPathRef.current, e.source, e.target)
      const isHover = hoveredEdgeRef.current === e

      // Curve control point — perpendicular offset
      const dx = b.x - a.x
      const dy = b.y - a.y
      const mx = (a.x + b.x) / 2 + dy * 0.12
      const my = (a.y + b.y) / 2 - dx * 0.12

      const strokeW =
        ((e.strength ?? 0.6) * (e.confirmed ? 1.6 : 1.0) + 0.4) / zoomRef.current
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.quadraticCurveTo(mx, my, b.x, b.y)

      if (isContradiction) {
        // Red cracked line
        ctx.strokeStyle = isHover ? 'rgba(239,68,68,1)' : 'rgba(239,68,68,0.8)'
        ctx.lineWidth = strokeW * 1.4
        const dl = 6 / zoomRef.current
        ctx.setLineDash([dl, dl * 0.55])
      } else if (isPath) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = strokeW * 2.2
        ctx.shadowBlur = 14
        ctx.shadowColor = 'rgba(251,191,36,0.7)'
      } else if (e.confirmed) {
        ctx.strokeStyle = isHover
          ? 'rgba(255,255,255,0.85)'
          : 'rgba(190,210,255,0.55)'
        ctx.lineWidth = strokeW
      } else {
        // unconfirmed (AI suggested) — dashed, faint
        const dl = 5 / zoomRef.current
        ctx.setLineDash([dl, dl * 1.2])
        ctx.strokeStyle = isHover ? 'rgba(170,190,255,0.7)' : 'rgba(170,190,255,0.28)'
        ctx.lineWidth = strokeW * 0.8
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1

      // ⚡ icon at midpoint for contradictions
      if (isContradiction) {
        const t = 0.5
        const qx =
          (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x
        const qy =
          (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y
        const r = 9 / zoomRef.current
        ctx.beginPath()
        ctx.arc(qx, qy, r, 0, Math.PI * 2)
        ctx.fillStyle =
          hoveredContradictionRef.current === e.contradiction!.key
            ? '#ef4444'
            : 'rgba(60,15,20,0.95)'
        ctx.fill()
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 1.2 / zoomRef.current
        ctx.stroke()
        ctx.fillStyle = '#fef2f2'
        ctx.font = `600 ${10 / zoomRef.current}px system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('!', qx, qy + 0.5 / zoomRef.current)
      }

      // Particles along confirmed (non-contradiction) edges
      if (e.confirmed && !isContradiction && aVis && bVis) {
        const period = 2200
        const phase = ((now + hashStr(e.source + e.target)) % period) / period
        // Single particle per edge
        const t = phase
        const qx = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x
        const qy = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y
        ctx.beginPath()
        ctx.arc(qx, qy, 2.2 / zoomRef.current, 0, Math.PI * 2)
        ctx.fillStyle = isPath
          ? 'rgba(254,243,199,0.95)'
          : 'rgba(220,235,255,0.85)'
        ctx.fill()
      }
    }

    // ── Note nodes ──────────────────────────────────────────────────────────
    for (const n of notesRef.current) {
      if (n.x == null || n.y == null) continue
      const parent = bubbleMap.get(n.bubbleId)
      const palette =
        CLUSTER_COLORS[parent?.colorKey ?? 'unassigned'] ?? CLUSTER_COLORS.unassigned
      const isHover =
        hoveredRef.current?.type === 'note' && hoveredRef.current.id === n.id
      const isHl = highlightedRef.current.has(n.id)
      const onPath = highlightedPathRef.current.includes(n.id)
      const visible = isNoteVisible(n.id)

      ctx.globalAlpha = visible ? 1 : 0.1

      // Drop shadow glow matching cluster color (only for hover/path/highlight)
      if (isHover || isHl || onPath) {
        ctx.save()
        ctx.shadowBlur = onPath ? 18 : 12
        ctx.shadowColor = onPath ? 'rgba(251,191,36,0.85)' : palette.glow
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fillStyle = onPath ? '#fbbf24' : palette.node
        ctx.fill()
        ctx.restore()
      } else {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fillStyle = palette.node
        ctx.fill()
      }

      // Border ring
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
      ctx.strokeStyle = isHl
        ? '#f5c842'
        : isHover
          ? '#ffffff'
          : palette.border
      ctx.lineWidth = (isHover || isHl ? 2 : 1.2) / zoomRef.current
      ctx.stroke()

      // Conflict pulse
      if (isHl) {
        const p = 0.5 + 0.5 * Math.sin(now * 0.004)
        const rr = n.radius + 6 + p * 4
        ctx.beginPath()
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(245,158,11,${0.45 + p * 0.3})`
        ctx.lineWidth = 1.4 / zoomRef.current
        ctx.stroke()
      }

      // Label inside node — bigger notes fit more text; render at any reasonable zoom
      if (zoomRef.current > 0.55 || isHover) {
        ctx.fillStyle = '#0a0a14'
        ctx.font = `600 ${Math.max(9, 11 / zoomRef.current)}px var(--font-dm-sans, system-ui, sans-serif)`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const maxChars = Math.max(6, Math.floor(n.radius / 3.2))
        const lbl =
          n.label.length > maxChars ? n.label.slice(0, maxChars - 1) + '…' : n.label
        ctx.fillText(lbl, n.x, n.y)
      }

      ctx.globalAlpha = 1
    }

    // ── Ghost nodes (Part 3D) ──────────────────────────────────────────────
    for (const g of ghostsRef.current) {
      const pos = ghostPositionsRef.current.get(g.id)
      if (!pos) continue
      const isHover = hoveredGhostRef.current === g.id
      const r = 26
      const p = 0.5 + 0.5 * Math.sin(now * 0.003)

      // Take color from first nearby bubble, else unassigned
      const firstBubble = bubbleMap.get(g.nearbyBubbleIds[0] ?? '')
      const palette =
        CLUSTER_COLORS[firstBubble?.colorKey ?? 'unassigned'] ?? CLUSTER_COLORS.unassigned

      ctx.save()
      ctx.globalAlpha = (isHover ? 0.7 : 0.4) + p * 0.15
      const dl = 4 / zoomRef.current
      ctx.setLineDash([dl, dl])
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
      ctx.strokeStyle = palette.border
      ctx.lineWidth = 1.5 / zoomRef.current
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // + icon
      ctx.beginPath()
      ctx.moveTo(pos.x - 7, pos.y)
      ctx.lineTo(pos.x + 7, pos.y)
      ctx.moveTo(pos.x, pos.y - 7)
      ctx.lineTo(pos.x, pos.y + 7)
      ctx.strokeStyle = isHover ? '#ffffff' : palette.border
      ctx.lineWidth = 1.6 / zoomRef.current
      ctx.stroke()

      // Concept label
      ctx.font = `500 ${Math.max(9, 11 / zoomRef.current)}px var(--font-dm-sans, system-ui, sans-serif)`
      ctx.fillStyle = isHover ? '#ffffff' : 'rgba(220,225,240,0.75)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(g.concept, pos.x, pos.y + r + 4 / zoomRef.current)
    }

    ctx.restore()

    // ── Tooltip (screen space) ──────────────────────────────────────────────
    const he = hoveredEdgeRef.current
    if (he && noteMap.get(he.source) && noteMap.get(he.target)) {
      const text = he.reason.length > 80 ? he.reason.slice(0, 77) + '…' : he.reason
      drawTooltip(ctx, text, tooltipRef.current.x, tooltipRef.current.y, W)
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const setSize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      panRef.current = { x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2 }
      // Nudge the simulation so bounds force re-centers nodes
      if (simRef.current && simRef.current.alpha() < 0.05) {
        simRef.current.alpha(0.15).restart()
      }
    }
    setSize()
    const ro = new ResizeObserver(setSize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  // ── Cleanup sim on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (simRef.current) simRef.current.stop()
    }
  }, [])

  // ── Hit testing ───────────────────────────────────────────────────────────
  function worldXY(clientX: number, clientY: number) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top - panRef.current.y) / zoomRef.current,
    }
  }

  function hitTest(clientX: number, clientY: number): {
    kind: 'note' | 'bubble' | 'contradiction' | 'ghost' | null
    id: string | null
    edge?: BubbleEdgeData
  } {
    const { x, y } = worldXY(clientX, clientY)

    // Ghost nodes (highest z-order)
    for (const g of ghostsRef.current) {
      const p = ghostPositionsRef.current.get(g.id)
      if (!p) continue
      const dx = x - p.x
      const dy = y - p.y
      if (dx * dx + dy * dy <= 26 * 26) {
        return { kind: 'ghost', id: g.id }
      }
    }

    // Notes
    for (const n of notesRef.current) {
      if (n.x == null || n.y == null) continue
      const dx = x - n.x
      const dy = y - n.y
      if (dx * dx + dy * dy <= n.radius * n.radius) {
        return { kind: 'note', id: n.id }
      }
    }

    // Contradiction icons (along edges, midpoint)
    const noteMap = new Map(notesRef.current.map((n) => [n.id, n]))
    for (const e of edgesRef.current) {
      if (!e.contradiction) continue
      const a = noteMap.get(e.source),
        b = noteMap.get(e.target)
      if (!a || !b || a.x == null || a.y == null || b.x == null || b.y == null) continue
      const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.12
      const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.12
      const t = 0.5
      const qx = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x
      const qy = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y
      const dx = x - qx,
        dy = y - qy
      const r = 11
      if (dx * dx + dy * dy <= r * r) {
        return { kind: 'contradiction', id: e.contradiction.key, edge: e }
      }
    }

    // Bubbles
    for (const b of bubblesRef.current) {
      if (b.x == null || b.y == null) continue
      const dx = x - b.x
      const dy = y - b.y
      if (dx * dx + dy * dy <= b.radius * b.radius) {
        return { kind: 'bubble', id: b.id }
      }
    }
    return { kind: null, id: null }
  }

  function edgeAt(clientX: number, clientY: number): BubbleEdgeData | null {
    const { x, y } = worldXY(clientX, clientY)
    const noteMap = new Map(notesRef.current.map((n) => [n.id, n]))
    const thresh = Math.max(64, 64 / (zoomRef.current * zoomRef.current))
    for (const e of edgesRef.current) {
      const a = noteMap.get(e.source),
        b = noteMap.get(e.target)
      if (!a || !b || a.x == null || a.y == null || b.x == null || b.y == null) continue
      const dx = b.x - a.x,
        dy = b.y - a.y
      const len2 = dx * dx + dy * dy
      if (len2 === 0) continue
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2))
      const px = a.x + t * dx - x,
        py = a.y + t * dy - y
      if (px * px + py * py < thresh) return e
    }
    return null
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (panningRef.current) {
      panRef.current = {
        x: panStartRef.current.px + (e.clientX - panStartRef.current.mx),
        y: panStartRef.current.py + (e.clientY - panStartRef.current.my),
      }
      return
    }
    const hit = hitTest(e.clientX, e.clientY)
    const prev = hoveredRef.current
    hoveredContradictionRef.current = hit.kind === 'contradiction' ? hit.id : null
    hoveredGhostRef.current = hit.kind === 'ghost' ? hit.id : null
    hoveredRef.current =
      hit.kind === 'note' || hit.kind === 'bubble'
        ? { id: hit.id!, type: hit.kind }
        : null
    hoveredEdgeRef.current = hoveredRef.current ? null : edgeAt(e.clientX, e.clientY)
    if (canvasRef.current) {
      canvasRef.current.style.cursor =
        hit.kind === 'note' ||
        hit.kind === 'bubble' ||
        hit.kind === 'contradiction' ||
        hit.kind === 'ghost'
          ? 'pointer'
          : 'grab'
      const rect = canvasRef.current.getBoundingClientRect()
      tooltipRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const newHoverId = hoveredRef.current?.id ?? null
    const prevHoverId = prev?.id ?? null
    if (onNodeHover && newHoverId !== prevHoverId) {
      onNodeHover(newHoverId, hoveredRef.current?.type ?? null)
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const hit = hitTest(e.clientX, e.clientY)
    if (!hit.id) {
      panningRef.current = true
      panStartRef.current = {
        mx: e.clientX,
        my: e.clientY,
        px: panRef.current.x,
        py: panRef.current.y,
      }
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
    }
  }

  function handleMouseUp() {
    panningRef.current = false
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
  }

  function handleMouseLeave() {
    hoveredRef.current = null
    hoveredEdgeRef.current = null
    hoveredContradictionRef.current = null
    hoveredGhostRef.current = null
    panningRef.current = false
    if (onNodeHover) onNodeHover(null, null)
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const hit = hitTest(e.clientX, e.clientY)
    if (hit.kind === 'note' || hit.kind === 'bubble') {
      onNodeClick(hit.id!, hit.kind, e.shiftKey)
    } else if (hit.kind === 'contradiction' && onContradictionClick) {
      onContradictionClick(hit.id!)
    } else if (hit.kind === 'ghost' && onGhostClick) {
      const ghost = ghostsRef.current.find((g) => g.id === hit.id)
      if (ghost) onGhostClick(ghost.concept)
    }
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.12 : 0.9
    const newZoom = Math.max(0.2, Math.min(4, zoomRef.current * factor))
    const ratio = newZoom / zoomRef.current
    panRef.current = {
      x: mx - (mx - panRef.current.x) * ratio,
      y: my - (my - panRef.current.y) * ratio,
    }
    zoomRef.current = newZoom
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onWheel={handleWheel}
    />
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function edgeOnPath(path: string[], a: string, b: string): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    if (
      (path[i] === a && path[i + 1] === b) ||
      (path[i] === b && path[i + 1] === a)
    ) {
      return true
    }
  }
  return false
}

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  W: number,
) {
  ctx.font = '12px var(--font-dm-sans, system-ui), sans-serif'
  const tw = ctx.measureText(text).width
  const pad = 10,
    bh = 30,
    bw = tw + pad * 2
  const bx = Math.min(x + 14, W - bw - 8)
  const by = Math.max(y - bh - 8, 8)
  ctx.fillStyle = 'rgba(5,10,24,0.96)'
  ctx.strokeStyle = 'rgba(96,165,250,0.45)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#e2e8f0'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, bx + pad, by + bh / 2)
}
