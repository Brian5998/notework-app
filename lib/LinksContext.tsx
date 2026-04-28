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
const SAMPLE_LINKS: NoteLink[] = [
  // Biology + chemistry — respiration / photosynthesis / thermo
  { id: 'sl-1', sourceNoteId: 'n-bio-respiration', targetNoteId: 'n-bio-photosynthesis', reason: 'Photosynthesis is the reverse reaction of cellular respiration', confirmedAt: now },
  { id: 'sl-2', sourceNoteId: 'n-bio-respiration', targetNoteId: 'n-chem-thermo', reason: 'Respiration is an exergonic process governed by thermodynamic laws', confirmedAt: now },
  { id: 'sl-3', sourceNoteId: 'n-bio-photosynthesis', targetNoteId: 'n-chem-thermo', reason: 'Photosynthesis stores energy — endergonic, governed by Gibbs free energy', confirmedAt: now },

  // Economics + psychology — behavioral economics
  { id: 'sl-4', sourceNoteId: 'n-econ-supply', targetNoteId: 'n-econ-game', reason: 'Strategic pricing extends supply/demand into game-theoretic competition', confirmedAt: now },
  { id: 'sl-5', sourceNoteId: 'n-psych-decisions', targetNoteId: 'n-econ-supply', reason: 'Behavioral economics shows cognitive biases violate the rational agent model', confirmedAt: now },
  { id: 'sl-6', sourceNoteId: 'n-psych-memory', targetNoteId: 'n-psych-decisions', reason: 'System 1 decisions rely on memory-cached heuristics and recall', confirmedAt: now },
  { id: 'sl-7', sourceNoteId: 'n-psych-decisions', targetNoteId: 'n-econ-game', reason: 'Cognitive biases shape the strategic choices game theory models', confirmedAt: now },

  // CS — graphs as a connector
  { id: 'sl-8', sourceNoteId: 'n-cs-graphs', targetNoteId: 'n-econ-game', reason: 'Game theory networks and social graphs use graph representations', confirmedAt: now },
  { id: 'sl-9', sourceNoteId: 'n-cs-graphs', targetNoteId: 'n-psych-memory', reason: 'Memory retrieval can be modeled as graph search across associations', confirmedAt: now },
]
