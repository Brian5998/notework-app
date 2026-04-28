// Pre-confirmed links between sample notes. Simulates a semester of use.
// Cross-course links have lower strengths (surprising but valid);
// within-course links have higher strengths (tight topical neighbors).

export type SampleLink = {
  id: string
  sourceNoteId: string
  targetNoteId: string
  label: string
  confirmedAt: string // ISO date
  strength: number // 0.0–1.0
}

const sampleLinks: SampleLink[] = [
  // ─── Cross-course links — the "interesting" ones ──────────────────────────
  {
    id: 'link-001',
    sourceNoteId: 'note-004', // ORF 307 duality
    targetNoteId: 'note-011', // ORF 335 FTAP
    label: 'LP duality ↔ no-arbitrage pricing (Farkas = FTAP)',
    confirmedAt: '2024-09-29T21:10:00Z',
    strength: 0.95,
  },
  {
    id: 'link-002',
    sourceNoteId: 'note-024', // PSY cognitive load
    targetNoteId: 'note-031', // NEU neural coding
    label: 'Working-memory capacity bounded by PFC persistent-activity bandwidth',
    confirmedAt: '2024-11-26T22:30:00Z',
    strength: 0.88,
  },
  {
    id: 'link-003',
    sourceNoteId: 'note-034', // HIS Schumpeter
    targetNoteId: 'note-015', // ORF 335 Fama-French + disruption
    label: 'Creative destruction as the dynamic behind value-vs-growth turnover',
    confirmedAt: '2024-11-19T20:05:00Z',
    strength: 0.82,
  },
  {
    id: 'link-004',
    sourceNoteId: 'note-020', // LIN Sapir-Whorf
    targetNoteId: 'note-023', // PSY framing
    label: 'Framing effects as behavioral evidence for weak linguistic relativity',
    confirmedAt: '2024-11-14T19:40:00Z',
    strength: 0.91,
  },
  {
    id: 'link-005',
    sourceNoteId: 'note-036', // SOC Durkheim social facts
    targetNoteId: 'note-006', // ORF 307 network flows
    label: 'Social facts as emergent system-level properties of social networks',
    confirmedAt: '2024-10-25T18:00:00Z',
    strength: 0.78,
  },
  {
    id: 'link-006',
    sourceNoteId: 'note-030', // NEU LTP revisited
    targetNoteId: 'note-008', // ORF 307 finals review learning rate
    label: 'Synaptic plasticity rule is a biological learning-rate schedule',
    confirmedAt: '2024-12-02T23:15:00Z',
    strength: 0.84,
  },
  {
    id: 'link-007',
    sourceNoteId: 'note-037', // SOC Weber rationalization
    targetNoteId: 'note-012', // ORF 335 CAPM / efficient frontier
    label: 'Mean-variance finance as instrumental rationality applied to investing',
    confirmedAt: '2024-10-23T20:45:00Z',
    strength: 0.76,
  },
  {
    id: 'link-008',
    sourceNoteId: 'note-019', // LIN Chomsky hierarchy
    targetNoteId: 'note-007', // ORF 307 IP + B&B
    label: 'Formal-language hierarchy mirrors complexity-class hierarchy',
    confirmedAt: '2024-11-08T22:20:00Z',
    strength: 0.86,
  },

  // ─── ORF 307 — within-course ──────────────────────────────────────────────
  {
    id: 'link-009',
    sourceNoteId: 'note-001', // LP basics
    targetNoteId: 'note-002', // simplex
    label: 'Simplex operates on the LP formulation from first principles',
    confirmedAt: '2024-09-17T12:00:00Z',
    strength: 0.96,
  },
  {
    id: 'link-010',
    sourceNoteId: 'note-002', // simplex
    targetNoteId: 'note-003', // Big-M
    label: 'Big-M extends simplex to problems without an obvious starting BFS',
    confirmedAt: '2024-09-24T13:30:00Z',
    strength: 0.94,
  },
  {
    id: 'link-011',
    sourceNoteId: 'note-004', // duality
    targetNoteId: 'note-005', // sensitivity / shadow prices
    label: 'Shadow prices are dual variables at the optimum',
    confirmedAt: '2024-10-10T19:15:00Z',
    strength: 0.97,
  },
  {
    id: 'link-012',
    sourceNoteId: 'note-005', // shadow prices
    targetNoteId: 'note-012', // ORF 335 CAPM risk pricing
    label: 'Shadow pricing of constraints parallels risk pricing in finance',
    confirmedAt: '2024-10-13T16:20:00Z',
    strength: 0.73,
  },
  {
    id: 'link-013',
    sourceNoteId: 'note-006', // network flows
    targetNoteId: 'note-007', // integer programming
    label: 'Many flow problems reduce to (totally unimodular) IPs',
    confirmedAt: '2024-11-07T21:00:00Z',
    strength: 0.85,
  },

  // ─── ORF 335 — within-course ──────────────────────────────────────────────
  {
    id: 'link-014',
    sourceNoteId: 'note-009', // forwards
    targetNoteId: 'note-014', // put-call parity
    label: 'Put-call parity generalizes the cash-and-carry argument to options',
    confirmedAt: '2024-11-05T18:40:00Z',
    strength: 0.92,
  },
  {
    id: 'link-015',
    sourceNoteId: 'note-010', // binomial tree
    targetNoteId: 'note-013', // Black-Scholes
    label: 'Black-Scholes is the continuous-time limit of the binomial model',
    confirmedAt: '2024-10-22T20:10:00Z',
    strength: 0.95,
  },
  {
    id: 'link-016',
    sourceNoteId: 'note-011', // FTAP
    targetNoteId: 'note-012', // CAPM
    label: 'Risk-neutral pricing vs CAPM expected-return pricing — different equilibrium concepts',
    confirmedAt: '2024-10-09T17:00:00Z',
    strength: 0.81,
  },

  // ─── LIN 201 — within-course ──────────────────────────────────────────────
  {
    id: 'link-017',
    sourceNoteId: 'note-016', // phonemes
    targetNoteId: 'note-017', // morphology
    label: 'Phonology → morphology: how sound units compose into word units',
    confirmedAt: '2024-09-18T14:20:00Z',
    strength: 0.89,
  },
  {
    id: 'link-018',
    sourceNoteId: 'note-017', // morphology
    targetNoteId: 'note-018', // syntax
    label: 'Morphology → syntax: words combine into phrases under structure rules',
    confirmedAt: '2024-09-30T13:00:00Z',
    strength: 0.90,
  },

  // ─── NEU 200 — within-course ──────────────────────────────────────────────
  {
    id: 'link-019',
    sourceNoteId: 'note-026', // action potentials
    targetNoteId: 'note-027', // synaptic transmission
    label: 'Action potentials trigger neurotransmitter release at the synapse',
    confirmedAt: '2024-09-23T12:30:00Z',
    strength: 0.96,
  },
  {
    id: 'link-020',
    sourceNoteId: 'note-028', // LTP NMDA only (early)
    targetNoteId: 'note-030', // LTP revisited (AMPA + NMDA)
    label: 'Refinement of LTP mechanism — initial NMDA-only view corrected',
    confirmedAt: '2024-11-01T21:00:00Z',
    strength: 0.93,
  },

  // ─── PSY 251 — within-course ──────────────────────────────────────────────
  {
    id: 'link-021',
    sourceNoteId: 'note-021', // exp design
    targetNoteId: 'note-022', // p-values
    label: 'Design choices determine the meaning of the resulting p-values',
    confirmedAt: '2024-09-25T17:00:00Z',
    strength: 0.87,
  },

  // ─── HIS 362 — within-course ──────────────────────────────────────────────
  {
    id: 'link-022',
    sourceNoteId: 'note-033', // Gilded Age railroads
    targetNoteId: 'note-034', // Schumpeter creative destruction
    label: 'Gilded Age consolidation as a pre-theoretical case of creative destruction',
    confirmedAt: '2024-11-08T23:45:00Z',
    strength: 0.80,
  },
]

export default sampleLinks
