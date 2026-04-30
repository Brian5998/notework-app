'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Note } from './types'

const STORAGE_KEY = 'notework_notes'

type NotesContextType = {
  notes: Note[]
  addNote: (title: string, content: string, tags?: string[]) => Note
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => void
  deleteNote: (id: string) => void
}

const NotesContext = createContext<NotesContextType | null>(null)

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.length > 0) { setNotes(parsed); return }
      }
    } catch {}
    setNotes(SAMPLE_NOTES)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  const addNote = useCallback((title: string, content: string, tags?: string[]): Note => {
    const note: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: new Date().toISOString(),
      tags,
    }
    setNotes((prev) => [note, ...prev])
    return note
  }, [])

  const updateNote = useCallback((id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)))
  }, [])

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotes must be used within NotesProvider')
  return ctx
}

const SAMPLE_NOTES: Note[] = [
  {
    id: 'n-bio-respiration',
    title: 'Cellular Respiration — Biology 201',
    content: `Cellular respiration breaks down glucose to produce ATP (adenosine triphosphate).

Three stages:
1. Glycolysis — cytoplasm, glucose → 2 pyruvate. Net: 2 ATP, 2 NADH.
2. Krebs Cycle — mitochondrial matrix. Each pyruvate → 1 ATP, 3 NADH, 1 FADH2.
3. Electron Transport Chain — inner mitochondrial membrane. NADH/FADH2 donate electrons, proton gradient drives ATP synthase. ~34 ATP.

Total: ~38 ATP per glucose. Oxygen is the final electron acceptor.`,
    createdAt: '2025-09-14T10:30:00.000Z',
    tags: ['biology', 'metabolism'],
  },
  {
    id: 'n-bio-respiration-revised',
    title: 'Respiration ATP Yield (revised) — Biology 201',
    content: `Updated my notes after Prof's lecture: the ~38 ATP figure I wrote in September is the textbook upper bound. The realistic yield per glucose is closer to 30–32 ATP.

The discrepancy comes from proton leak across the inner mitochondrial membrane and the cost of transporting NADH from the cytoplasm into the mitochondria.

Also: the Krebs cycle does NOT happen in the mitochondrial matrix in prokaryotes — they don't have mitochondria. It happens in the cytoplasm.`,
    createdAt: '2025-11-08T16:20:00.000Z',
    tags: ['biology', 'metabolism', 'corrections'],
  },
  {
    id: 'n-bio-photosynthesis',
    title: 'Photosynthesis — Biology 201',
    content: `Photosynthesis is the reverse of respiration. Plants convert CO2 + H2O → glucose + O2.

Light reactions: thylakoid membranes. Chlorophyll absorbs light, splits water, produces ATP + NADPH.
Calvin Cycle: stroma. Fixes CO2 into G3P using ATP and NADPH.

Equation: 6CO2 + 6H2O + light → C6H12O6 + 6O2
Plants photosynthesize during day, respire all the time.`,
    createdAt: '2025-09-21T11:15:00.000Z',
    tags: ['biology', 'metabolism'],
  },
  {
    id: 'n-chem-thermo',
    title: 'Thermodynamics — Chemistry 101',
    content: `First Law: energy is conserved. Second Law: entropy always increases.

Gibbs Free Energy: ΔG = ΔH - TΔS.
ΔG < 0 = spontaneous. ΔG > 0 = non-spontaneous.
ATP hydrolysis (ΔG = -7.3 kcal/mol) is coupled to drive cellular work — directly powering respiration.`,
    createdAt: '2025-10-10T10:00:00.000Z',
    tags: ['chemistry', 'thermodynamics'],
  },
  {
    id: 'n-econ-supply',
    title: 'Supply and Demand — Econ 101',
    content: `Law of demand: as price rises, quantity demanded falls.
Law of supply: as price rises, quantity supplied rises.

Equilibrium: where supply and demand curves intersect. Market clears at this price.
Surplus = price above equilibrium. Shortage = price below equilibrium.

Shifts vs movements: a change in price causes movement along the curve. A change in income, preferences, or input costs shifts the entire curve.`,
    createdAt: '2025-09-10T09:00:00.000Z',
    tags: ['economics', 'micro'],
  },
  {
    id: 'n-econ-game',
    title: 'Game Theory Basics — Econ 101',
    content: `Game theory studies strategic decision-making where outcomes depend on choices of all players.

Key concepts:
- Nash Equilibrium: no player can improve their outcome by unilaterally changing strategy.
- Prisoner's Dilemma: individually rational choices lead to collectively worse outcomes.
- Dominant strategy: a strategy best regardless of what others do.

Applications: pricing competition, arms races, environmental treaties, evolution (hawk-dove game).`,
    createdAt: '2025-10-22T13:00:00.000Z',
    tags: ['economics', 'theory'],
  },
  {
    id: 'n-psych-memory',
    title: 'Memory Systems — Psychology 101',
    content: `Three-stage model of memory:
1. Sensory memory: very brief (~0.5s visual, ~3s auditory).
2. Short-term / working memory: holds ~7±2 items for ~20-30 seconds. Chunking helps.
3. Long-term memory: relatively permanent — explicit (declarative) and implicit (procedural).

Encoding: deeper processing = better retention.
Retrieval: cues matter. Context-dependent and state-dependent memory.`,
    createdAt: '2025-09-12T11:00:00.000Z',
    tags: ['psychology', 'cognition'],
  },
  {
    id: 'n-psych-decisions',
    title: 'Decision Making & Biases — Psychology 101',
    content: `Dual-process theory (Kahneman):
- System 1: fast, automatic, intuitive. Prone to biases.
- System 2: slow, deliberate, analytical. Effortful.

Key biases:
- Anchoring, availability heuristic, confirmation bias.
- Loss aversion: losses feel ~2x as painful as equivalent gains.
- Framing effect: decisions change based on how options are presented.

Connects to economics — behavioral economics shows how biases cause systematic deviations from the rational-agent model.`,
    createdAt: '2025-10-20T10:00:00.000Z',
    tags: ['psychology', 'decisions'],
  },
  {
    id: 'n-cs-graphs',
    title: 'Graph Theory — CS 201',
    content: `A graph G = (V, E) where V = vertices, E = edges.

Types: directed vs undirected, weighted vs unweighted, cyclic vs acyclic.

Key algorithms:
- BFS: shortest path in unweighted graphs. O(V+E).
- DFS: useful for topological sort, cycle detection. O(V+E).
- Dijkstra: shortest path in weighted graphs.

Applications: social networks, road maps, dependency resolution, neural networks. Even the Forest View in this app is a graph.`,
    createdAt: '2025-10-12T14:30:00.000Z',
    tags: ['cs', 'graphs'],
  },

  // ── Intentional contradiction pair #2 — Econ 101 elasticity ──
  // The September note says elastic goods see revenue rise when price drops.
  // The October note flips it — claims raising the price helps elastic goods.
  // Notework should catch this.
  {
    id: 'n-econ-elasticity',
    title: 'Price Elasticity — Econ 101',
    content: `Elasticity measures how responsive quantity demanded is to price changes.

Ed = % change in Qd / % change in P.

- Elastic (Ed > 1): quantity responds MORE than price. Lowering price increases total revenue. Luxury goods.
- Inelastic (Ed < 1): quantity responds LESS than price. Raising price increases total revenue. Necessities like gasoline.

Determinants: substitutes available, necessity vs luxury, time horizon, share of budget.`,
    createdAt: '2025-09-17T14:00:00.000Z',
    tags: ['economics', 'micro'],
  },
  {
    id: 'n-econ-elasticity-quick-ref',
    title: 'Elasticity Quick Reference — Econ 101',
    content: `Cheat sheet for the midterm:

- Elastic goods (Ed > 1): RAISING the price increases total revenue.
- Inelastic goods (Ed < 1): LOWERING the price increases total revenue.
- Necessities like gasoline are typically elastic.
- Luxury goods are typically inelastic.

Time horizon doesn't really affect elasticity — short-run and long-run end up the same.`,
    createdAt: '2025-10-25T11:00:00.000Z',
    tags: ['economics', 'micro', 'review'],
  },

  // Extra notes — give the suggestions + neighbors panels something to work with
  {
    id: 'n-bio-feedback',
    title: 'Feedback Loops — Biology 201',
    content: `Homeostasis is maintained through feedback loops.

Negative feedback (most common): output reduces the stimulus.
- Blood sugar rises → insulin released → glucose absorbed → blood sugar drops.
- Body temperature rises → sweating → cools down.

Positive feedback (rarer): output amplifies the stimulus.
- Oxytocin during childbirth → contractions → more oxytocin.
- Blood clotting cascade.

Le Chatelier's Principle in chemistry is essentially negative feedback applied to chemical equilibria.`,
    createdAt: '2025-10-15T11:30:00.000Z',
    tags: ['biology', 'systems'],
  },
  {
    id: 'n-econ-externalities',
    title: 'Externalities & Market Failure — Econ 101',
    content: `Externalities are costs or benefits imposed on third parties not in the transaction.

Negative externalities (e.g. pollution): the market overproduces the good.
Positive externalities (e.g. vaccines, education): the market underproduces it.

Solutions:
- Pigouvian taxes (tax the negative)
- Subsidies (boost the positive)
- Cap-and-trade
- Property rights / Coase theorem

Conceptually: externalities are broken feedback loops — the market signal doesn't reach all the affected parties.`,
    createdAt: '2025-10-08T10:30:00.000Z',
    tags: ['economics', 'policy'],
  },
]
