'use client'

import { useRef, useEffect, useCallback } from 'react'

export type GraphNode = {
  id: string
  label: string
  type: 'note' | 'cluster'
  noteCount?: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  connectionCount?: number
  createdAt?: string
}

export type GraphEdge = {
  source: string
  target: string
  reason: string
}

type Props = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick: (id: string, type: 'note' | 'cluster') => void
  onNodeHover?: (id: string | null, type: 'note' | 'cluster' | null) => void
  highlightedNodeIds?: string[]
}

const REPULSION = 5500
const SPRING_K = 0.042
const REST_LEN = 140
const GRAVITY = 0.016
const DAMPING = 0.78
const MAX_FRAMES = 600

export default function ForestCanvas({ nodes: initNodes, edges, onNodeClick, onNodeHover, highlightedNodeIds }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const rafRef = useRef<number>(0)
  const frameRef = useRef(0)
  const hoveredRef = useRef<string | null>(null)
  const hoveredEdgeRef = useRef<GraphEdge | null>(null)
  const tooltipRef = useRef({ x: 0, y: 0 })
  const highlightedRef = useRef<Set<string>>(new Set(highlightedNodeIds ?? []))

  // Pan + zoom
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const panningRef = useRef(false)
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const prevIdsRef = useRef('')

  useEffect(() => {
    highlightedRef.current = new Set(highlightedNodeIds ?? [])
  }, [highlightedNodeIds])

  // Init/update node positions when the node set changes
  useEffect(() => {
    const ids = initNodes.map((n) => n.id).sort().join('|')
    if (ids === prevIdsRef.current) return
    prevIdsRef.current = ids

    // Preserve positions of nodes that already exist
    const existMap = Object.fromEntries(nodesRef.current.map((n) => [n.id, { x: n.x, y: n.y }]))
    const count = initNodes.length

    nodesRef.current = initNodes.map((n, i) => {
      const ex = existMap[n.id]
      if (ex) return { ...n, x: ex.x, y: ex.y, vx: 0, vy: 0 }
      // Spread new nodes in a circle around origin
      const angle = (i / Math.max(count, 1)) * Math.PI * 2
      const r = 60 + i * 18
      return {
        ...n,
        x: r * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: r * Math.sin(angle) + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
      }
    })
    frameRef.current = 0
  }, [initNodes])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const ns = nodesRef.current
    const nodeMap = Object.fromEntries(ns.map((n) => [n.id, n]))

    // ── Physics ─────────────────────────────────────────────────────────────
    if (frameRef.current < MAX_FRAMES) {
      frameRef.current++

      // Repulsion + collision
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i], b = ns[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
          const minD = a.radius + b.radius + 22
          const f = REPULSION / (d * d)
          const nx = dx / d, ny = dy / d
          a.vx -= nx * f; a.vy -= ny * f
          b.vx += nx * f; b.vy += ny * f
          if (d < minD) {
            const push = (minD - d) / 2
            a.x -= nx * push; a.y -= ny * push
            b.x += nx * push; b.y += ny * push
          }
        }
      }

      // Spring along edges
      for (const e of edges) {
        const a = nodeMap[e.source], b = nodeMap[e.target]
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const f = SPRING_K * (d - REST_LEN)
        const fx = (dx / d) * f, fy = (dy / d) * f
        a.vx += fx; a.vy += fy
        b.vx -= fx; b.vy -= fy
      }

      // Gravity toward origin
      for (const n of ns) {
        n.vx -= n.x * GRAVITY
        n.vy -= n.y * GRAVITY
        n.vx *= DAMPING; n.vy *= DAMPING
        n.x += n.vx; n.y += n.vy
      }
    }

    // ── Background ───────────────────────────────────────────────────────────
    ctx.fillStyle = '#0D0D0B'
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.translate(panRef.current.x, panRef.current.y)
    ctx.scale(zoomRef.current, zoomRef.current)

    // Dot grid
    {
      const gs = 48
      const px = panRef.current.x, py = panRef.current.y
      const z = zoomRef.current
      const sx = Math.floor(-px / z / gs) * gs - gs
      const sy = Math.floor(-py / z / gs) * gs - gs
      const ex = sx + W / z + gs * 3
      const ey = sy + H / z + gs * 3
      ctx.fillStyle = 'rgba(255,255,255,0.03)'
      for (let gx = sx; gx < ex; gx += gs) {
        for (let gy = sy; gy < ey; gy += gs) {
          ctx.beginPath()
          ctx.arc(gx, gy, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // ── Edges (quadratic bezier) ──────────────────────────────────────────────
    for (const e of edges) {
      const a = nodeMap[e.source], b = nodeMap[e.target]
      if (!a || !b) continue
      const isH = hoveredEdgeRef.current === e
      const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.08
      const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.08
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.quadraticCurveTo(mx, my, b.x, b.y)
      ctx.strokeStyle = isH ? 'rgba(92,184,122,0.7)' : 'rgba(255,255,255,0.1)'
      ctx.lineWidth = (isH ? 1.8 : 1) / zoomRef.current
      ctx.stroke()
      // Midpoint dot on hover
      if (isH) {
        const t = 0.5
        const qx = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x
        const qy = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y
        ctx.beginPath()
        ctx.arc(qx, qy, 3 / zoomRef.current, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(92,184,122,0.85)'
        ctx.fill()
      }
    }

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const now = Date.now()
    for (const n of ns) {
      const isH = hoveredRef.current === n.id
      const isHl = highlightedRef.current.has(n.id)
      const r = n.radius

      if (n.type === 'cluster') {
        // ── Cluster hub ──────────────────────────────────────────────────────
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.0016)

        // Outer ambient glow
        const glowR = r * (isH ? 2.1 : 1.65)
        const glow = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, glowR)
        glow.addColorStop(0, `rgba(45,90,61,${0.2 + pulse * 0.1})`)
        glow.addColorStop(1, 'rgba(45,90,61,0)')
        ctx.beginPath()
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // Main fill
        const fill = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.35, 0, n.x, n.y, r)
        fill.addColorStop(0, isH ? 'rgba(82,165,112,0.52)' : 'rgba(48,92,63,0.50)')
        fill.addColorStop(1, isH ? 'rgba(28,52,36,0.75)' : 'rgba(14,28,18,0.70)')
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = fill
        ctx.fill()

        // Dashed border ring
        const dl = 5 / zoomRef.current
        ctx.setLineDash([dl, dl * 0.9])
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = isH
          ? 'rgba(92,184,122,0.95)'
          : `rgba(92,184,122,${0.32 + pulse * 0.22})`
        ctx.lineWidth = (isH ? 2 : 1.5) / zoomRef.current
        ctx.stroke()
        ctx.setLineDash([])

        // Topic label (word-wrapped)
        const fs = Math.max(10, r * 0.27)
        ctx.font = `600 ${fs}px system-ui,sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = isH ? '#ffffff' : 'rgba(240,238,232,0.93)'

        const maxW = r * 1.52
        const words = n.label.split(' ')
        const lines: string[] = []
        let cur = ''
        for (const w of words) {
          const test = cur ? `${cur} ${w}` : w
          if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w } else { cur = test }
        }
        if (cur) lines.push(cur)

        const lh = fs * 1.28
        const topLines = lines.slice(0, 3)
        const hasCount = !!n.noteCount
        const blockH = topLines.length * lh
        const labelY = n.y - (hasCount ? lh * 0.55 : 0) - blockH / 2 + lh / 2

        topLines.forEach((line, i) => {
          ctx.fillText(
            topLines.length > 2 && i === 2 && lines.length > 3 ? line.slice(0, -1) + '…' : line,
            n.x, labelY + i * lh, maxW,
          )
        })

        // Note count badge
        if (hasCount) {
          ctx.font = `400 ${Math.max(8, fs * 0.76)}px system-ui,sans-serif`
          ctx.fillStyle = 'rgba(92,184,122,0.78)'
          ctx.fillText(`${n.noteCount} notes`, n.x, n.y + r * 0.56)
        }

        // Expand hint on hover
        if (isH) {
          ctx.font = `400 ${Math.max(8, fs * 0.68)}px system-ui,sans-serif`
          ctx.fillStyle = 'rgba(255,255,255,0.35)'
          ctx.fillText('click to expand', n.x, n.y + r + 13 / zoomRef.current)
        }

      } else {
        // ── Note node ────────────────────────────────────────────────────────
        const isIsolated = (n.connectionCount ?? 2) <= 1
        const nodeOpacity = isIsolated ? 0.5 : 1
        const nodeScale = isIsolated ? 0.75 : 1
        const effectiveR = r * nodeScale

        // Conflict highlight ring
        if (isHl) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.004)
          const rr = r + 6 + pulse * 4
          const gl = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, rr + 5)
          gl.addColorStop(0, `rgba(245,158,11,${0.35 + pulse * 0.2})`)
          gl.addColorStop(1, 'rgba(245,158,11,0)')
          ctx.beginPath(); ctx.arc(n.x, n.y, rr + 5, 0, Math.PI * 2)
          ctx.fillStyle = gl; ctx.fill()
        }

        // Hover glow
        if (isH) {
          const gl = ctx.createRadialGradient(n.x, n.y, effectiveR * 0.4, n.x, n.y, effectiveR * 2.2)
          gl.addColorStop(0, 'rgba(92,184,122,0.2)')
          gl.addColorStop(1, 'rgba(92,184,122,0)')
          ctx.beginPath(); ctx.arc(n.x, n.y, effectiveR * 2.2, 0, Math.PI * 2)
          ctx.fillStyle = gl; ctx.fill()
        }

        ctx.globalAlpha = isH ? 1 : nodeOpacity

        // Main fill
        const fill = ctx.createRadialGradient(n.x - effectiveR * 0.28, n.y - effectiveR * 0.28, 0, n.x, n.y, effectiveR)
        fill.addColorStop(0, isH ? '#2E6040' : '#1E3228')
        fill.addColorStop(1, isH ? '#1C3C2A' : '#111D17')
        ctx.beginPath(); ctx.arc(n.x, n.y, effectiveR, 0, Math.PI * 2)
        ctx.fillStyle = fill; ctx.fill()
        ctx.strokeStyle = isH
          ? 'rgba(92,184,122,0.85)'
          : isHl ? 'rgba(245,158,11,0.7)'
          : isIsolated ? 'rgba(92,184,122,0.15)' : 'rgba(92,184,122,0.28)'
        ctx.lineWidth = (isH ? 1.5 : isIsolated ? 0.7 : 1) / zoomRef.current
        if (isIsolated && !isH) {
          const dl = 4 / zoomRef.current
          ctx.setLineDash([dl, dl])
        }
        ctx.stroke()
        if (isIsolated && !isH) ctx.setLineDash([])

        // Label
        ctx.fillStyle = isH ? '#ffffff' : `rgba(240,238,232,${isIsolated ? 0.55 : 0.82})`
        ctx.font = `500 ${isIsolated ? 9 : 10}px system-ui,sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        const lbl = n.label.length > 13 ? n.label.slice(0, 12) + '…' : n.label
        ctx.fillText(lbl, n.x, n.y)

        ctx.globalAlpha = 1
      }
    }

    ctx.restore()

    // ── Edge tooltip (screen space) ───────────────────────────────────────────
    const he = hoveredEdgeRef.current
    if (he && nodeMap[he.source] && nodeMap[he.target]) {
      const tx = tooltipRef.current.x
      const ty = tooltipRef.current.y
      const text = he.reason.length > 72 ? he.reason.slice(0, 69) + '…' : he.reason
      ctx.font = '12px system-ui,sans-serif'
      const tw = ctx.measureText(text).width
      const pad = 10, bh = 30, bw = tw + pad * 2
      const bx = Math.min(tx + 14, W - bw - 8)
      const by = Math.max(ty - bh - 8, 8)
      ctx.fillStyle = 'rgba(12,12,10,0.96)'
      ctx.strokeStyle = 'rgba(92,184,122,0.45)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6)
      ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#F0EEE8'
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText(text, bx + pad, by + bh / 2)
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [edges])

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    frameRef.current = 0
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      frameRef.current = 0
    })
    ro.observe(canvas)
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    panRef.current = { x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2 }
    return () => ro.disconnect()
  }, [])

  // ── Hit testing ─────────────────────────────────────────────────────────────
  function worldXY(clientX: number, clientY: number) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top - panRef.current.y) / zoomRef.current,
    }
  }

  function nodeAt(clientX: number, clientY: number): GraphNode | null {
    if (!canvasRef.current) return null
    const { x, y } = worldXY(clientX, clientY)
    // Check in reverse order so topmost node wins
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i]
      const dx = n.x - x, dy = n.y - y
      if (dx * dx + dy * dy <= n.radius * n.radius) return n
    }
    return null
  }

  function edgeAt(clientX: number, clientY: number): GraphEdge | null {
    if (!canvasRef.current) return null
    const { x, y } = worldXY(clientX, clientY)
    const nm = Object.fromEntries(nodesRef.current.map((n) => [n.id, n]))
    const thresh = Math.max(64, 64 / (zoomRef.current * zoomRef.current))
    for (const e of edges) {
      const a = nm[e.source], b = nm[e.target]
      if (!a || !b) continue
      const dx = b.x - a.x, dy = b.y - a.y
      const len2 = dx * dx + dy * dy
      if (len2 === 0) continue
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2))
      const px = a.x + t * dx - x, py = a.y + t * dy - y
      if (px * px + py * py < thresh) return e
    }
    return null
  }

  // ── Event handlers ──────────────────────────────────────────────────────────
  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (panningRef.current) {
      panRef.current = {
        x: panStartRef.current.px + (e.clientX - panStartRef.current.mx),
        y: panStartRef.current.py + (e.clientY - panStartRef.current.my),
      }
      if (frameRef.current >= MAX_FRAMES) frameRef.current = MAX_FRAMES - 1
      return
    }
    const node = nodeAt(e.clientX, e.clientY)
    const prevHovered = hoveredRef.current
    hoveredRef.current = node?.id ?? null
    hoveredEdgeRef.current = node ? null : edgeAt(e.clientX, e.clientY)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = node ? 'pointer' : 'grab'
      const rect = canvasRef.current.getBoundingClientRect()
      tooltipRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    if (frameRef.current >= MAX_FRAMES) frameRef.current = MAX_FRAMES - 1
    if (onNodeHover && (node?.id ?? null) !== prevHovered) {
      onNodeHover(node?.id ?? null, node?.type ?? null)
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!nodeAt(e.clientX, e.clientY)) {
      panningRef.current = true
      panStartRef.current = {
        mx: e.clientX, my: e.clientY,
        px: panRef.current.x, py: panRef.current.y,
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
    panningRef.current = false
    if (onNodeHover) onNodeHover(null, null)
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const node = nodeAt(e.clientX, e.clientY)
    if (node) onNodeClick(node.id, node.type)
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.12 : 0.9
    const newZoom = Math.max(0.15, Math.min(5, zoomRef.current * factor))
    const ratio = newZoom / zoomRef.current
    panRef.current = {
      x: mx - (mx - panRef.current.x) * ratio,
      y: my - (my - panRef.current.y) * ratio,
    }
    zoomRef.current = newZoom
    if (frameRef.current >= MAX_FRAMES) frameRef.current = MAX_FRAMES - 1
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
