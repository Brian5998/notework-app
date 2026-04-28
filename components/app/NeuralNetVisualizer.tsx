'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const W = 680
const H = 340
const PAD_X = 60
const PAD_Y = 40

const COL = {
  bg: '#0F1110',
  edge: '#2A2D2C',
  edgeFaded: '#1A1C1B',
  input: '#5BA3D0',
  hidden: '#9B7BD4',
  output: '#5CB87A',
  amber: '#F5C842',
  coral: '#F26A4F',
  dropped: '#3A3C3B',
  text: '#9E9C95',
  textBright: '#F0EEE8',
}

type ActFn = 'relu' | 'sigmoid' | 'tanh'
type Direction = 'forward' | 'back' | null

type Node = {
  x: number
  y: number
  layerIndex: number
  nodeIndex: number
  type: 'input' | 'hidden' | 'output'
}

const ACT_LABEL: Record<ActFn, string> = {
  relu: 'ReLU',
  sigmoid: 'σ',
  tanh: 'tanh',
}

const ACT_DESC: Record<ActFn, string> = {
  relu: 'Rectified Linear: f(x) = max(0, x). Cheap, sparse, the workhorse.',
  sigmoid: 'Sigmoid: 1/(1+e⁻ˣ). Squashes to (0,1). Saturates at extremes.',
  tanh: 'Tanh: zero-centered (−1,1). Sigmoid\u2019s better-behaved cousin.',
}

function nodeKey(li: number, ni: number) {
  return `${li}.${ni}`
}

export default function NeuralNetVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSigRef = useRef<string>('')

  const [hiddenLayers, setHiddenLayers] = useState(2)
  const [neuronsPerLayer, setNeuronsPerLayer] = useState(4)
  const [activationFn, setActivationFn] = useState<ActFn>('relu')
  const [dropoutActive, setDropoutActive] = useState(false)
  const [droppedNodes, setDroppedNodes] = useState<Set<string>>(new Set())
  const [animLayer, setAnimLayer] = useState<number | null>(null)
  const [animDirection, setAnimDirection] = useState<Direction>(null)
  const [selectedNode, setSelectedNode] = useState<{ li: number; ni: number } | null>(null)
  const [hoverNode, setHoverNode] = useState<{ li: number; ni: number } | null>(null)

  const totalLayers = hiddenLayers + 2

  const nodes = useMemo<Node[]>(() => {
    const out: Node[] = []
    const usableW = W - PAD_X * 2
    const usableH = H - PAD_Y * 2
    const colSpacing = totalLayers > 1 ? usableW / (totalLayers - 1) : 0

    for (let li = 0; li < totalLayers; li++) {
      const isInput = li === 0
      const isOutput = li === totalLayers - 1
      const count = isInput ? 3 : isOutput ? 2 : neuronsPerLayer
      const type: Node['type'] = isInput ? 'input' : isOutput ? 'output' : 'hidden'
      const x = PAD_X + colSpacing * li
      const rowSpacing = count > 1 ? usableH / (count - 1) : 0
      const startY = count > 1 ? PAD_Y : H / 2
      for (let ni = 0; ni < count; ni++) {
        const y = count > 1 ? startY + rowSpacing * ni : startY
        out.push({ x, y, layerIndex: li, nodeIndex: ni, type })
      }
    }
    return out
  }, [totalLayers, neuronsPerLayer])

  // Group nodes by layer for fast edge lookup
  const layerNodes = useMemo(() => {
    const byLayer: Node[][] = Array.from({ length: totalLayers }, () => [])
    for (const n of nodes) byLayer[n.layerIndex].push(n)
    return byLayer
  }, [nodes, totalLayers])

  // Lazy init canvas context
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    ctxRef.current = c.getContext('2d')
  }, [])

  // Re-roll dropout when toggled or topology changes
  useEffect(() => {
    if (!dropoutActive) {
      setDroppedNodes(new Set())
      return
    }
    const dropped = new Set<string>()
    // Drop ~30% of hidden nodes
    for (const n of nodes) {
      if (n.type === 'hidden' && Math.random() < 0.3) {
        dropped.add(nodeKey(n.layerIndex, n.nodeIndex))
      }
    }
    setDroppedNodes(dropped)
  }, [dropoutActive, nodes])

  // Draw on discrete state changes only
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return

    const sig = JSON.stringify({
      n: nodes.length,
      hl: hiddenLayers,
      npl: neuronsPerLayer,
      af: activationFn,
      drop: Array.from(droppedNodes).sort().join(','),
      al: animLayer,
      ad: animDirection,
      sel: selectedNode ? `${selectedNode.li}.${selectedNode.ni}` : '',
      hov: hoverNode ? `${hoverNode.li}.${hoverNode.ni}` : '',
    })
    if (sig === prevSigRef.current) return
    prevSigRef.current = sig

    draw(ctx, {
      nodes,
      layerNodes,
      droppedNodes,
      animLayer,
      animDirection,
      selectedNode,
      hoverNode,
      totalLayers,
    })
  }, [
    nodes,
    layerNodes,
    droppedNodes,
    animLayer,
    animDirection,
    selectedNode,
    hoverNode,
    hiddenLayers,
    neuronsPerLayer,
    activationFn,
    totalLayers,
  ])

  // Cleanup animation timer on unmount or re-render
  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current)
    }
  }, [])

  const cancelAnim = () => {
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current)
      animTimerRef.current = null
    }
  }

  const runForward = () => {
    cancelAnim()
    setAnimDirection('forward')
    let li = 0
    const step = () => {
      if (li >= totalLayers) {
        animTimerRef.current = setTimeout(() => {
          setAnimLayer(null)
          setAnimDirection(null)
        }, 320)
        return
      }
      setAnimLayer(li)
      li++
      animTimerRef.current = setTimeout(step, 420)
    }
    step()
  }

  const runBackprop = () => {
    cancelAnim()
    setAnimDirection('back')
    let li = totalLayers - 1
    const step = () => {
      if (li < 0) {
        animTimerRef.current = setTimeout(() => {
          setAnimLayer(null)
          setAnimDirection(null)
        }, 320)
        return
      }
      setAnimLayer(li)
      li--
      animTimerRef.current = setTimeout(step, 420)
    }
    step()
  }

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const y = ((e.clientY - rect.top) / rect.height) * H
    const hit = hitTest(nodes, x, y)
    if (
      (hit?.layerIndex ?? -1) !== (hoverNode?.li ?? -1) ||
      (hit?.nodeIndex ?? -1) !== (hoverNode?.ni ?? -1)
    ) {
      setHoverNode(hit ? { li: hit.layerIndex, ni: hit.nodeIndex } : null)
    }
  }

  const handleCanvasLeave = () => setHoverNode(null)

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const y = ((e.clientY - rect.top) / rect.height) * H
    const hit = hitTest(nodes, x, y)
    if (hit) setSelectedNode({ li: hit.layerIndex, ni: hit.nodeIndex })
    else setSelectedNode(null)
  }

  // Info panel content
  const infoText = (() => {
    if (selectedNode) {
      const n = nodes.find(
        (x) => x.layerIndex === selectedNode.li && x.nodeIndex === selectedNode.ni,
      )
      if (!n) return defaultInfo()
      const isDropped = droppedNodes.has(nodeKey(n.layerIndex, n.nodeIndex))
      const layerLabel =
        n.type === 'input'
          ? 'Input layer'
          : n.type === 'output'
          ? 'Output layer'
          : `Hidden layer ${n.layerIndex} of ${hiddenLayers}`
      const role =
        n.type === 'input'
          ? 'Receives a feature value, passes it forward unchanged.'
          : n.type === 'output'
          ? 'Produces a prediction. Loss is computed against the label here.'
          : `Computes a weighted sum of upstream signals, applies ${ACT_LABEL[activationFn]}.`
      return (
        <>
          <div style={{ fontWeight: 600, color: COL.textBright, marginBottom: 4 }}>
            Neuron {n.layerIndex}·{n.nodeIndex} <span style={{ color: COL.text, fontWeight: 400 }}>— {layerLabel}</span>
          </div>
          <div style={{ color: COL.text, lineHeight: 1.55 }}>
            {role}
            {isDropped && (
              <> <span style={{ color: COL.coral }}>Dropped this pass</span> — its outputs are zeroed and its weights skip this update.</>
            )}
          </div>
        </>
      )
    }
    if (animDirection === 'forward' && animLayer !== null) {
      return (
        <>
          <div style={{ fontWeight: 600, color: COL.amber, marginBottom: 4 }}>
            Forward pass — layer {animLayer}
          </div>
          <div style={{ color: COL.text, lineHeight: 1.55 }}>
            Each node takes Σ(wᵢxᵢ) + b, applies {ACT_LABEL[activationFn]}, and sends the result downstream.
          </div>
        </>
      )
    }
    if (animDirection === 'back' && animLayer !== null) {
      return (
        <>
          <div style={{ fontWeight: 600, color: COL.coral, marginBottom: 4 }}>
            Backprop — layer {animLayer}
          </div>
          <div style={{ color: COL.text, lineHeight: 1.55 }}>
            Gradients flow right→left via the chain rule. Each weight learns ∂L/∂w from its downstream error.
          </div>
        </>
      )
    }
    return defaultInfo()
  })()

  return (
    <div
      style={{
        background: 'var(--bg-card, #1C1C1A)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: 18,
        padding: 20,
        color: COL.textBright,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: COL.text, fontWeight: 600 }}>
            Live demo
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 500, marginTop: 4 }}>
            How a network thinks
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', color: COL.text }}>
          Hover · click · run
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 14 }}>
        <SliderControl
          label="Hidden layers"
          value={hiddenLayers}
          min={1}
          max={4}
          onChange={(v) => {
            cancelAnim()
            setAnimLayer(null)
            setAnimDirection(null)
            setHiddenLayers(v)
          }}
        />
        <SliderControl
          label="Neurons / layer"
          value={neuronsPerLayer}
          min={2}
          max={6}
          onChange={(v) => {
            cancelAnim()
            setAnimLayer(null)
            setAnimDirection(null)
            setNeuronsPerLayer(v)
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: COL.text, fontWeight: 600 }}>
            Activation
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['relu', 'sigmoid', 'tanh'] as ActFn[]).map((a) => (
              <button
                key={a}
                onClick={() => setActivationFn(a)}
                style={{
                  padding: '0.4rem 0.7rem',
                  fontSize: '0.82rem',
                  borderRadius: 7,
                  border: '1px solid ' + (activationFn === a ? 'var(--accent-mid, #5CB87A)' : 'var(--border, rgba(255,255,255,0.08))'),
                  background: activationFn === a ? 'var(--accent-light, rgba(92,184,122,0.12))' : 'transparent',
                  color: activationFn === a ? 'var(--accent, #5CB87A)' : COL.textBright,
                  cursor: 'pointer',
                  fontWeight: activationFn === a ? 600 : 400,
                }}
              >
                {ACT_LABEL[a]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <ActionBtn onClick={runForward} disabled={animDirection !== null} accent={COL.amber}>
          Run forward pass
        </ActionBtn>
        <ActionBtn onClick={runBackprop} disabled={animDirection !== null} accent={COL.coral}>
          Show backprop
        </ActionBtn>
        <ActionBtn
          onClick={() => setDropoutActive((d) => !d)}
          accent={dropoutActive ? COL.dropped : '#888'}
          active={dropoutActive}
        >
          {dropoutActive ? 'Dropout: on' : 'Toggle dropout'}
        </ActionBtn>
      </div>

      {/* Canvas */}
      <div
        style={{
          background: COL.bg,
          borderRadius: 12,
          border: '1px solid var(--border, rgba(255,255,255,0.06))',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onMouseMove={handleCanvasMove}
          onMouseLeave={handleCanvasLeave}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            cursor: hoverNode ? 'pointer' : 'default',
          }}
        />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12, fontSize: '0.78rem', color: COL.text }}>
        <LegendDot color={COL.input} label="Input" />
        <LegendDot color={COL.hidden} label="Hidden" />
        <LegendDot color={COL.output} label="Output" />
        <LegendDot color={COL.amber} label="Active signal" />
        <LegendDot color={COL.coral} label="Backprop" />
        {dropoutActive && <LegendDot color={COL.dropped} label="Dropped" />}
      </div>

      {/* Info panel */}
      <div
        style={{
          marginTop: 14,
          padding: '0.85rem 1rem',
          background: 'var(--bg-elevated, #1C1C1A)',
          border: '1px solid var(--border, rgba(255,255,255,0.08))',
          borderRadius: 10,
          fontSize: '0.92rem',
          minHeight: 56,
        }}
      >
        {infoText}
      </div>
    </div>
  )
}

function defaultInfo() {
  return (
    <div style={{ color: COL.text, lineHeight: 1.55 }}>
      Click a neuron to inspect it, or run a forward pass.
    </div>
  )
}

/* ----------------------------- Sub-components ----------------------------- */

function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
      <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: COL.text, fontWeight: 600 }}>
        {label} <span style={{ color: COL.textBright, marginLeft: 6 }}>{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          accentColor: 'var(--accent, #5CB87A)',
          width: '100%',
        }}
      />
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  disabled,
  accent,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  accent: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.55rem 0.9rem',
        fontSize: '0.88rem',
        borderRadius: 8,
        border: `1px solid ${active ? accent : 'var(--border, rgba(255,255,255,0.08))'}`,
        background: active ? `${accent}22` : 'transparent',
        color: active ? accent : COL.textBright,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontWeight: 500,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}

/* ------------------------------- Hit testing ------------------------------ */

function hitTest(nodes: Node[], x: number, y: number): Node | null {
  const r2 = 14 * 14
  for (const n of nodes) {
    const dx = n.x - x
    const dy = n.y - y
    if (dx * dx + dy * dy <= r2) return n
  }
  return null
}

/* ---------------------------------- Draw --------------------------------- */

type DrawState = {
  nodes: Node[]
  layerNodes: Node[][]
  droppedNodes: Set<string>
  animLayer: number | null
  animDirection: Direction
  selectedNode: { li: number; ni: number } | null
  hoverNode: { li: number; ni: number } | null
  totalLayers: number
}

function draw(ctx: CanvasRenderingContext2D, s: DrawState) {
  ctx.clearRect(0, 0, W, H)

  // 1. Background subtle gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0F1110')
  grad.addColorStop(1, '#0B0D0C')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // 2. Base edges (grey)
  ctx.lineWidth = 0.8
  ctx.strokeStyle = COL.edge
  for (let li = 0; li < s.totalLayers - 1; li++) {
    const a = s.layerNodes[li]
    const b = s.layerNodes[li + 1]
    for (const na of a) {
      const aDropped = s.droppedNodes.has(nodeKey(na.layerIndex, na.nodeIndex))
      for (const nb of b) {
        const bDropped = s.droppedNodes.has(nodeKey(nb.layerIndex, nb.nodeIndex))
        ctx.strokeStyle = aDropped || bDropped ? COL.edgeFaded : COL.edge
        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.stroke()
      }
    }
  }

  // 3. Active edges on top
  if (s.animLayer !== null && s.animDirection !== null) {
    const al = s.animLayer
    const color = s.animDirection === 'forward' ? COL.amber : COL.coral
    let fromLayer: number | null = null
    let toLayer: number | null = null

    if (s.animDirection === 'forward' && al > 0) {
      fromLayer = al - 1
      toLayer = al
    } else if (s.animDirection === 'back' && al < s.totalLayers - 1) {
      fromLayer = al
      toLayer = al + 1
    }

    if (fromLayer !== null && toLayer !== null) {
      ctx.lineWidth = 1.8
      ctx.strokeStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 6
      const a = s.layerNodes[fromLayer]
      const b = s.layerNodes[toLayer]
      for (const na of a) {
        if (s.droppedNodes.has(nodeKey(na.layerIndex, na.nodeIndex))) continue
        for (const nb of b) {
          if (s.droppedNodes.has(nodeKey(nb.layerIndex, nb.nodeIndex))) continue
          ctx.beginPath()
          ctx.moveTo(na.x, na.y)
          ctx.lineTo(nb.x, nb.y)
          ctx.stroke()
        }
      }
      ctx.shadowBlur = 0
    }
  }

  // 4. Nodes
  for (const n of s.nodes) {
    const isDropped = s.droppedNodes.has(nodeKey(n.layerIndex, n.nodeIndex))
    const isActive = s.animLayer === n.layerIndex && s.animDirection !== null
    const isSelected = s.selectedNode?.li === n.layerIndex && s.selectedNode?.ni === n.nodeIndex
    const isHover = s.hoverNode?.li === n.layerIndex && s.hoverNode?.ni === n.nodeIndex

    const baseColor =
      n.type === 'input' ? COL.input : n.type === 'output' ? COL.output : COL.hidden
    const fillColor = isDropped
      ? COL.dropped
      : isActive
      ? s.animDirection === 'forward'
        ? COL.amber
        : COL.coral
      : baseColor

    ctx.beginPath()
    ctx.arc(n.x, n.y, 9, 0, Math.PI * 2)
    ctx.fillStyle = fillColor
    if (isActive && !isDropped) {
      ctx.shadowColor = fillColor
      ctx.shadowBlur = 12
    }
    ctx.fill()
    ctx.shadowBlur = 0

    // Inner dark dot for input/output for definition
    if (!isDropped) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fill()
    }

    // Cross out if dropped
    if (isDropped) {
      ctx.strokeStyle = '#1A1C1B'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(n.x - 6, n.y - 6)
      ctx.lineTo(n.x + 6, n.y + 6)
      ctx.moveTo(n.x + 6, n.y - 6)
      ctx.lineTo(n.x - 6, n.y + 6)
      ctx.stroke()
    }

    // 5. Outer ring for selected / hover / active
    if (isSelected || isHover || (isActive && !isDropped)) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, 14, 0, Math.PI * 2)
      ctx.strokeStyle = isSelected ? COL.textBright : isActive ? fillColor : 'rgba(240,238,232,0.5)'
      ctx.lineWidth = isSelected ? 1.5 : 1
      ctx.stroke()
    }
  }

  // 6. Layer labels at bottom
  ctx.font = '10px ui-sans-serif, system-ui'
  ctx.textAlign = 'center'
  ctx.fillStyle = COL.text
  for (let li = 0; li < s.totalLayers; li++) {
    const layer = s.layerNodes[li]
    if (!layer.length) continue
    const x = layer[0].x
    const label =
      li === 0
        ? 'Input'
        : li === s.totalLayers - 1
        ? 'Output'
        : `Hidden ${li}`
    ctx.fillText(label, x, H - 12)
  }
}
