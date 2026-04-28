// Theme colors for cluster bubbles in the Forest View.
// Used by both Part 1 (default fallback) and Part 2 (Claude-classified).

export type ClusterColorKey =
  | 'stem'
  | 'humanities'
  | 'science'
  | 'finance'
  | 'language'
  | 'unassigned'

export type ClusterColor = {
  fill: string // ~10% opacity rgba — used for bubble fill
  border: string // bright color — border + glow
  node: string // mid color — note nodes inside the bubble
  glow: string // rgba w/ alpha for outer drop shadow
  label: string // human label for picker / debug
}

export const CLUSTER_COLORS: Record<ClusterColorKey, ClusterColor> = {
  stem: {
    fill: 'rgba(59,130,246,0.10)',
    border: '#60a5fa',
    node: '#93c5fd',
    glow: 'rgba(96,165,250,0.55)',
    label: 'STEM / Math / CS',
  },
  humanities: {
    fill: 'rgba(168,85,247,0.10)',
    border: '#c084fc',
    node: '#d8b4fe',
    glow: 'rgba(192,132,252,0.55)',
    label: 'Humanities / Writing',
  },
  science: {
    fill: 'rgba(34,197,94,0.10)',
    border: '#4ade80',
    node: '#86efac',
    glow: 'rgba(74,222,128,0.55)',
    label: 'Science / Environment',
  },
  finance: {
    fill: 'rgba(245,158,11,0.10)',
    border: '#fbbf24',
    node: '#fcd34d',
    glow: 'rgba(251,191,36,0.55)',
    label: 'Economics / Finance',
  },
  language: {
    fill: 'rgba(236,72,153,0.10)',
    border: '#f472b6',
    node: '#f9a8d4',
    glow: 'rgba(244,114,182,0.55)',
    label: 'Language / Culture',
  },
  unassigned: {
    fill: 'rgba(107,114,128,0.10)',
    border: '#9ca3af',
    node: '#d1d5db',
    glow: 'rgba(156,163,175,0.45)',
    label: 'Unassigned',
  },
}

const ALL_KEYS: ClusterColorKey[] = [
  'stem',
  'humanities',
  'science',
  'finance',
  'language',
  'unassigned',
]

export function isClusterColorKey(value: unknown): value is ClusterColorKey {
  return typeof value === 'string' && (ALL_KEYS as string[]).includes(value)
}

// Heuristic local fallback based on label keywords + course codes.
// Used when the AI classifier hasn't run yet so the bubble has *some* color
// instead of gray on first render. Claude will overwrite this once classified.
export function inferColorKey(label: string): ClusterColorKey {
  const l = label.toLowerCase()

  // Course code prefixes (strongest signal when present)
  if (/\b(orf|cos|mat|ele|mae|ece|eas|cbe|cs|ee|ma|mat)\s*\d/.test(l)) {
    // ORF 335 = finance-y, but ORF 307 = stem. Use finer check below.
    if (/\b(orf\s*3[3-4]\d|orf\s*4[0-5]\d|fin|econ)\b/.test(l)) return 'finance'
    return 'stem'
  }
  if (/\b(neu|psy|eeb|mol|che|phy|geo|ast)\s*\d/.test(l)) return 'science'
  if (/\b(his|phi|rel|art|cla|eng|mus|afs|ams|gss)\s*\d/.test(l)) return 'humanities'
  if (/\b(soc|pol|ant|woc)\s*\d/.test(l)) return 'humanities'
  if (/\b(lin|spa|fre|ger|chi|jpn|kor|ita|por|rus)\s*\d/.test(l)) return 'language'

  // STEM: math, optimization, CS, ML, engineering
  if (
    /\b(math|calc|algebra|stat|optim|linear|simplex|duality|matrix|vector|differential|integral|derivative|gradient|algorithm|complexity|np[- ]?hard|graph theory|data structure|computer|programming|software|machine learning|\bml\b|neural net|deep learning|\bai\b|engineering|kernel|regression|probability|combinator|discrete math|proof|theorem|lemma|topology|analysis)\b/.test(
      l,
    )
  ) {
    return 'stem'
  }

  // Finance / economics
  if (
    /\b(econ|finance|financial|market|invest|portfolio|capital(ism)?|trade|monetary|fiscal|stock|bond|valuation|pricing|risk|arbitrage|option|derivative pricing|black.?scholes|ftap|capm|fama.?french|schumpeter|keynes|marx|supply|demand|game theory|micro|macro|gdp|inflation)\b/.test(
      l,
    )
  ) {
    return 'finance'
  }

  // Natural science (biology / chemistry / neuroscience / physics-of-world)
  if (
    /\b(biolog|cell|protein|enzyme|photosynth|respir|mitosis|meiosis|dna|rna|genom|evolut|organism|specie|ecolog|environment|climate|geolog|astron|cosmolog|chem|bond|molecul|acid|base|thermo|reaction|equilibrium|neuron|synap|neuro|brain|ltp|action potential|membrane|receptor|cortex|hippocamp|amygdala|dopamine|serotonin|anatomy|physiolog|disease|pathol|cancer|drug|medicine|pharma)\b/.test(
      l,
    )
  ) {
    return 'science'
  }

  // Humanities / writing / sociology / philosophy / history
  if (
    /\b(history|historic|literature|philosoph|writing|essay|rhetoric|critique|theology|religion|sociolog|durkheim|weber|marx\b(?!et)|anthropolog|culture(?!\s*:)|ethnograph|media studies|art history|painting|sculpture|music theory|musicolog)\b/.test(
      l,
    )
  ) {
    return 'humanities'
  }

  // Language / linguistics
  if (
    /\b(language|linguist|phonem|phonolog|syntax|morpholog|grammar|semantics|pragmatics|chomsky|sapir|whorf|spanish|french|german|chinese|mandarin|japanese|korean|italian|portuguese|russian|arabic|hebrew|latin|greek)\b/.test(
      l,
    )
  ) {
    return 'language'
  }

  return 'unassigned'
}
