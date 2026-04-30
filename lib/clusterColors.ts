// Theme colors for cluster bubbles in the Forest View.
// Used by both Part 1 (default fallback) and Part 2 (Claude-classified).
//
// Palette goals:
// - Each color is distinguishable from every other at small sizes
// - All colors live in the same brightness range (no muddy or too-bright)
// - Slightly desaturated jewel tones — sit comfortably on a #050a18 bg
// - Always at least 6 distinct hues so adjacent clusters don't share a color

export type ClusterColorKey =
  | 'stem'
  | 'humanities'
  | 'science'
  | 'finance'
  | 'language'
  | 'arts'
  | 'social'
  | 'tech'
  | 'health'
  | 'unassigned'

export type ClusterColor = {
  fill: string // ~10% opacity rgba — used for bubble fill
  border: string // bright color — border + glow
  node: string // mid color — note nodes inside the bubble
  glow: string // rgba w/ alpha for outer drop shadow
  label: string // human label for picker / debug
}

export const CLUSTER_COLORS: Record<ClusterColorKey, ClusterColor> = {
  // Cool blue — STEM, math, CS, optimization
  stem: {
    fill: 'rgba(59,130,246,0.10)',
    border: '#60a5fa',
    node: '#93c5fd',
    glow: 'rgba(96,165,250,0.55)',
    label: 'STEM / Math / CS',
  },
  // Lavender — humanities, history, philosophy
  humanities: {
    fill: 'rgba(168,85,247,0.10)',
    border: '#c084fc',
    node: '#d8b4fe',
    glow: 'rgba(192,132,252,0.55)',
    label: 'Humanities / Writing',
  },
  // Emerald — biology, chemistry, neuroscience
  science: {
    fill: 'rgba(34,197,94,0.10)',
    border: '#4ade80',
    node: '#86efac',
    glow: 'rgba(74,222,128,0.55)',
    label: 'Science / Biology',
  },
  // Amber — finance, economics, markets
  finance: {
    fill: 'rgba(245,158,11,0.10)',
    border: '#fbbf24',
    node: '#fcd34d',
    glow: 'rgba(251,191,36,0.55)',
    label: 'Economics / Finance',
  },
  // Pink — language, linguistics
  language: {
    fill: 'rgba(236,72,153,0.10)',
    border: '#f472b6',
    node: '#f9a8d4',
    glow: 'rgba(244,114,182,0.55)',
    label: 'Language / Culture',
  },
  // Coral — arts, design, music
  arts: {
    fill: 'rgba(251,113,133,0.10)',
    border: '#fb7185',
    node: '#fda4af',
    glow: 'rgba(251,113,133,0.5)',
    label: 'Arts / Design',
  },
  // Teal — sociology, anthropology, politics
  social: {
    fill: 'rgba(20,184,166,0.10)',
    border: '#2dd4bf',
    node: '#5eead4',
    glow: 'rgba(45,212,191,0.55)',
    label: 'Social Sciences',
  },
  // Indigo — engineering, software, deep tech
  tech: {
    fill: 'rgba(99,102,241,0.10)',
    border: '#818cf8',
    node: '#a5b4fc',
    glow: 'rgba(129,140,248,0.55)',
    label: 'Engineering / Tech',
  },
  // Salmon — psychology, cognition, health
  health: {
    fill: 'rgba(248,113,113,0.10)',
    border: '#fca5a5',
    node: '#fecaca',
    glow: 'rgba(252,165,165,0.55)',
    label: 'Psychology / Health',
  },
  // Stone — fallback when nothing else matches
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
  'arts',
  'social',
  'tech',
  'health',
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
    if (/\b(orf\s*3[3-4]\d|orf\s*4[0-5]\d|fin|econ)\b/.test(l)) return 'finance'
    if (/\b(cos|cs|ele|ece|mae|cbe|ee|eng)\s*\d/.test(l)) return 'tech'
    return 'stem'
  }
  if (/\b(neu|psy)\s*\d/.test(l)) return 'health'
  if (/\b(eeb|mol|che|phy|geo|ast)\s*\d/.test(l)) return 'science'
  if (/\b(art|mus|tha|vis|dan)\s*\d/.test(l)) return 'arts'
  if (/\b(his|phi|rel|cla|eng|afs|ams|gss)\s*\d/.test(l)) return 'humanities'
  if (/\b(soc|pol|ant|woc)\s*\d/.test(l)) return 'social'
  if (/\b(lin|spa|fre|ger|chi|jpn|kor|ita|por|rus)\s*\d/.test(l)) return 'language'

  // Engineering / software / tech (more specific than STEM)
  if (
    /\b(software|programming|computer|algorithm|data structure|graph theory|machine learning|\bml\b|deep learning|neural net|\bai\b|engineering|robotic|systems|architect|cybersec|crypto|blockchain|kernel|operating system|\bos\b|distributed|networking)\b/.test(
      l,
    )
  ) {
    return 'tech'
  }

  // STEM: math, optimization, theoretical CS
  if (
    /\b(math|calc|algebra|stat|optim|linear|simplex|duality|matrix|vector|differential|integral|derivative|gradient|complexity|np[- ]?hard|probability|combinator|discrete math|proof|theorem|lemma|topology|analysis|set theory|number theory)\b/.test(
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

  // Psychology / cognition / health
  if (
    /\b(psycholog|cognit|behaviour|behavior|memory|perception|emotion|motivation|consciousness|kahneman|tversky|freud|piaget|sleep|stress|disease|pathol|cancer|drug|medicine|pharma|clinical|therapy|disorder|mental health)\b/.test(
      l,
    )
  ) {
    return 'health'
  }

  // Natural science (biology / chemistry / neuroscience / physics)
  if (
    /\b(biolog|cell|protein|enzyme|photosynth|respir|mitosis|meiosis|dna|rna|genom|evolut|organism|specie|ecolog|environment|climate|geolog|astron|cosmolog|chem|bond|molecul|acid|base|thermo|reaction|equilibrium|neuron|synap|neuro|brain|ltp|action potential|membrane|receptor|cortex|hippocamp|amygdala|dopamine|serotonin|anatomy|physiolog|physic|quantum|relativity)\b/.test(
      l,
    )
  ) {
    return 'science'
  }

  // Social sciences (sociology, anthropology, politics)
  if (
    /\b(sociolog|durkheim|weber|anthropolog|ethnograph|politic|election|democrac|authoritarian|government|policy|public administration|international relations|geopolit|race|gender|inequality)\b/.test(
      l,
    )
  ) {
    return 'social'
  }

  // Arts / design / music
  if (
    /\b(art history|painting|sculpture|music theory|musicolog|composer|design|typography|architect|film|cinema|theater|theatre|dance|choreograph|photograph|aesthet|graphic design|industrial design)\b/.test(
      l,
    )
  ) {
    return 'arts'
  }

  // Humanities / writing / philosophy / history / religion
  if (
    /\b(history|historic|literature|philosoph|writing|essay|rhetoric|critique|theology|religion|culture(?!\s*:)|media studies|humanit)\b/.test(
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
