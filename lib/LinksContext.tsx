'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { NoteLink, DismissedSuggestion, Contradiction } from './types'

const STORAGE_KEY = 'notework-links'

type LinksState = {
  confirmedLinks: NoteLink[]
  dismissedSuggestions: DismissedSuggestion[]
  dismissedContradictions: string[]
  detectedContradictions: Contradiction[]
  contradictionResolutions: ContradictionResolution[]
}

type ContradictionResolution = {
  key: string
  action: 'resolved' | 'dismissed'
  timestamp: number
}

type LinksContextValue = {
  confirmedLinks: NoteLink[]
  dismissedSuggestions: DismissedSuggestion[]
  dismissedContradictions: string[]
  detectedContradictions: Contradiction[]
  contradictionResolutions: ContradictionResolution[]
  confirmLink: (sourceId: string, targetId: string, reason: string) => void
  dismissSuggestion: (sourceId: string, targetId: string) => void
  removeLink: (linkId: string) => void
  removeLinksByNoteId: (noteId: string) => void
  isDismissed: (sourceId: string, targetId: string) => boolean
  isConfirmed: (sourceId: string, targetId: string) => boolean
  getLinksForNote: (noteId: string) => NoteLink[]
  dismissContradiction: (key: string) => void
  resolveContradiction: (key: string) => void
  restoreContradiction: (key: string) => void
  isContradictionDismissed: (key: string) => boolean
  getContradictionsForNote: (noteId: string) => Contradiction[]
  updateDetectedContradictions: (contradictions: Contradiction[]) => void
}

const LinksContext = createContext<LinksContextValue | null>(null)

const EMPTY: LinksState = { confirmedLinks: [], dismissedSuggestions: [], dismissedContradictions: [], detectedContradictions: [], contradictionResolutions: [] }

export function makeContradictionKey(noteIds: string[], explanation: string): string {
  return [...noteIds].sort().join(':') + '|' + explanation.slice(0, 40)
}

export function LinksProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LinksState>(EMPTY)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.confirmedLinks?.length > 0) {
          setState({ dismissedContradictions: [], detectedContradictions: [], contradictionResolutions: [], ...parsed })
          return
        }
      }
    } catch {}
    setState({ ...EMPTY, confirmedLinks: SAMPLE_LINKS })
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const confirmLink = useCallback((sourceId: string, targetId: string, reason: string) => {
    setState((prev) => {
      const already = prev.confirmedLinks.some(
        (l) =>
          (l.sourceNoteId === sourceId && l.targetNoteId === targetId) ||
          (l.sourceNoteId === targetId && l.targetNoteId === sourceId)
      )
      if (already) return prev
      return {
        ...prev,
        dismissedSuggestions: prev.dismissedSuggestions.filter(
          (d) =>
            !(d.sourceNoteId === sourceId && d.targetNoteId === targetId) &&
            !(d.sourceNoteId === targetId && d.targetNoteId === sourceId)
        ),
        confirmedLinks: [
          ...prev.confirmedLinks,
          { id: crypto.randomUUID(), sourceNoteId: sourceId, targetNoteId: targetId, reason, confirmedAt: Date.now() },
        ],
      }
    })
  }, [])

  const dismissSuggestion = useCallback((sourceId: string, targetId: string) => {
    setState((prev) => {
      const already = prev.dismissedSuggestions.some(
        (d) =>
          (d.sourceNoteId === sourceId && d.targetNoteId === targetId) ||
          (d.sourceNoteId === targetId && d.targetNoteId === sourceId)
      )
      if (already) return prev
      return {
        ...prev,
        dismissedSuggestions: [...prev.dismissedSuggestions, { sourceNoteId: sourceId, targetNoteId: targetId }],
      }
    })
  }, [])

  const removeLink = useCallback((linkId: string) => {
    setState((prev) => ({
      ...prev,
      confirmedLinks: prev.confirmedLinks.filter((l) => l.id !== linkId),
    }))
  }, [])

  const removeLinksByNoteId = useCallback((noteId: string) => {
    setState((prev) => ({
      ...prev,
      confirmedLinks: prev.confirmedLinks.filter(
        (l) => l.sourceNoteId !== noteId && l.targetNoteId !== noteId
      ),
      dismissedSuggestions: prev.dismissedSuggestions.filter(
        (d) => d.sourceNoteId !== noteId && d.targetNoteId !== noteId
      ),
    }))
  }, [])

  const isDismissed = useCallback(
    (sourceId: string, targetId: string) =>
      state.dismissedSuggestions.some(
        (d) =>
          (d.sourceNoteId === sourceId && d.targetNoteId === targetId) ||
          (d.sourceNoteId === targetId && d.targetNoteId === sourceId)
      ),
    [state.dismissedSuggestions]
  )

  const isConfirmed = useCallback(
    (sourceId: string, targetId: string) =>
      state.confirmedLinks.some(
        (l) =>
          (l.sourceNoteId === sourceId && l.targetNoteId === targetId) ||
          (l.sourceNoteId === targetId && l.targetNoteId === sourceId)
      ),
    [state.confirmedLinks]
  )

  const getLinksForNote = useCallback(
    (noteId: string) =>
      state.confirmedLinks.filter(
        (l) => l.sourceNoteId === noteId || l.targetNoteId === noteId
      ),
    [state.confirmedLinks]
  )

  const dismissContradiction = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      dismissedContradictions: prev.dismissedContradictions.includes(key)
        ? prev.dismissedContradictions
        : [...prev.dismissedContradictions, key],
      contradictionResolutions: [
        ...prev.contradictionResolutions,
        { key, action: 'dismissed' as const, timestamp: Date.now() },
      ],
    }))
  }, [])

  const resolveContradiction = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      dismissedContradictions: prev.dismissedContradictions.includes(key)
        ? prev.dismissedContradictions
        : [...prev.dismissedContradictions, key],
      contradictionResolutions: [
        ...prev.contradictionResolutions,
        { key, action: 'resolved' as const, timestamp: Date.now() },
      ],
    }))
  }, [])

  const restoreContradiction = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      dismissedContradictions: prev.dismissedContradictions.filter((k) => k !== key),
    }))
  }, [])

  const isContradictionDismissed = useCallback(
    (key: string) => state.dismissedContradictions.includes(key),
    [state.dismissedContradictions]
  )

  const getContradictionsForNote = useCallback(
    (noteId: string) =>
      state.detectedContradictions.filter(
        (c) =>
          c.noteIds.includes(noteId) &&
          !state.dismissedContradictions.includes(
            makeContradictionKey(c.noteIds, c.explanation),
          ),
      ),
    [state.detectedContradictions, state.dismissedContradictions],
  )

  const updateDetectedContradictions = useCallback((contradictions: Contradiction[]) => {
    setState((prev) => ({ ...prev, detectedContradictions: contradictions }))
  }, [])

  return (
    <LinksContext.Provider
      value={{
        confirmedLinks: state.confirmedLinks,
        dismissedSuggestions: state.dismissedSuggestions,
        dismissedContradictions: state.dismissedContradictions,
        detectedContradictions: state.detectedContradictions,
        contradictionResolutions: state.contradictionResolutions,
        confirmLink,
        dismissSuggestion,
        removeLink,
        removeLinksByNoteId,
        isDismissed,
        isConfirmed,
        getLinksForNote,
        dismissContradiction,
        resolveContradiction,
        restoreContradiction,
        isContradictionDismissed,
        getContradictionsForNote,
        updateDetectedContradictions,
      }}
    >
      {children}
    </LinksContext.Provider>
  )
}

export function useLinks() {
  const ctx = useContext(LinksContext)
  if (!ctx) throw new Error('useLinks must be used within LinksProvider')
  return ctx
}

const now = Date.now()
// Every note has at least one cross-cluster link confirmed (so the Forest
// looks alive immediately) BUT plenty of obvious neighbors stay un-confirmed
// so the user can exercise the Suggestions panel.
const SAMPLE_LINKS: NoteLink[] = [
  // ── Within-cluster confirmed (denses up each cluster) ──
  { id: 'sl-bio-1', sourceNoteId: 'n-bio-respiration', targetNoteId: 'n-bio-photosynthesis', reason: 'Photosynthesis is the reverse reaction of cellular respiration', confirmedAt: now },
  { id: 'sl-bio-2', sourceNoteId: 'n-bio-respiration', targetNoteId: 'n-bio-respiration-revised', reason: 'Refinement of the ATP yield figure — same concept, updated numbers', confirmedAt: now },
  { id: 'sl-econ-1', sourceNoteId: 'n-econ-supply', targetNoteId: 'n-econ-externalities', reason: 'Externalities cause deviations from supply/demand equilibrium', confirmedAt: now },

  // ── Cross-cluster confirmed (every note touches a different cluster) ──
  // n-bio-respiration ↔ n-chem-thermo (Bio ↔ Chem)
  { id: 'sl-x-1', sourceNoteId: 'n-bio-respiration', targetNoteId: 'n-chem-thermo', reason: 'Respiration is an exergonic process governed by Gibbs free energy', confirmedAt: now },
  // n-bio-photosynthesis ↔ n-chem-thermo (Bio ↔ Chem)
  { id: 'sl-x-2', sourceNoteId: 'n-bio-photosynthesis', targetNoteId: 'n-chem-thermo', reason: 'Photosynthesis stores energy — endergonic, governed by ΔG', confirmedAt: now },
  // n-bio-feedback ↔ n-econ-externalities (Bio ↔ Econ)
  { id: 'sl-x-3', sourceNoteId: 'n-bio-feedback', targetNoteId: 'n-econ-externalities', reason: 'Externalities are broken feedback loops — the market signal misses the affected parties', confirmedAt: now },
  // n-bio-respiration-revised ↔ n-psych-memory (Bio ↔ Psych) — somewhat surprising
  { id: 'sl-x-4', sourceNoteId: 'n-bio-respiration-revised', targetNoteId: 'n-psych-memory', reason: 'Both rely on layered correction — refining old memories or earlier figures', confirmedAt: now },
  // n-psych-decisions ↔ n-econ-game (Psych ↔ Econ) — behavioral economics
  { id: 'sl-x-5', sourceNoteId: 'n-psych-decisions', targetNoteId: 'n-econ-game', reason: 'Behavioral biases shape the strategic choices game theory models', confirmedAt: now },
  // n-cs-graphs ↔ n-econ-game (CS ↔ Econ)
  { id: 'sl-x-6', sourceNoteId: 'n-cs-graphs', targetNoteId: 'n-econ-game', reason: 'Game-theoretic interactions are naturally modeled as graphs', confirmedAt: now },
  // n-cs-graphs ↔ n-psych-memory (CS ↔ Psych)
  { id: 'sl-x-7', sourceNoteId: 'n-cs-graphs', targetNoteId: 'n-psych-memory', reason: 'Memory retrieval can be modeled as graph search across associations', confirmedAt: now },
  // n-econ-elasticity ↔ n-econ-supply (Econ ↔ Econ — within cluster but uses elasticity note)
  { id: 'sl-x-8', sourceNoteId: 'n-econ-elasticity', targetNoteId: 'n-econ-supply', reason: 'Elasticity describes the slope of the demand curve', confirmedAt: now },
  // n-econ-elasticity-quick-ref ↔ n-psych-memory (Econ ↔ Psych) — quick reference cards parallel memory chunking
  { id: 'sl-x-9', sourceNoteId: 'n-econ-elasticity-quick-ref', targetNoteId: 'n-psych-memory', reason: 'Quick-reference cards are a chunking strategy — fits the cognitive-load model', confirmedAt: now },

  // ❗️ Deliberately UN-confirmed (will appear in the Suggestions panel):
  //   - n-econ-elasticity ↔ n-econ-elasticity-quick-ref (the contradicting pair — testing the wedge!)
  //   - n-bio-respiration ↔ n-bio-feedback (homeostasis regulating respiration)
  //   - n-econ-supply ↔ n-econ-game (strategic pricing extends supply/demand)
  //   - n-bio-photosynthesis ↔ n-bio-feedback (CO2 / O2 atmospheric feedback)
  //   - n-cs-graphs ↔ n-bio-feedback (feedback loops as cyclic graphs)
]
