'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { NoteLink, DismissedSuggestion, Contradiction } from './types'

const STORAGE_KEY = 'notework-links'

type LinksState = {
  confirmedLinks: NoteLink[]
  dismissedSuggestions: DismissedSuggestion[]
  dismissedContradictions: string[]  // stable keys
  detectedContradictions: Contradiction[]
}

type LinksContextValue = {
  confirmedLinks: NoteLink[]
  dismissedSuggestions: DismissedSuggestion[]
  dismissedContradictions: string[]
  detectedContradictions: Contradiction[]
  confirmLink: (sourceId: string, targetId: string, reason: string) => void
  dismissSuggestion: (sourceId: string, targetId: string) => void
  removeLink: (linkId: string) => void
  removeLinksByNoteId: (noteId: string) => void
  isDismissed: (sourceId: string, targetId: string) => boolean
  isConfirmed: (sourceId: string, targetId: string) => boolean
  getLinksForNote: (noteId: string) => NoteLink[]
  dismissContradiction: (key: string) => void
  restoreContradiction: (key: string) => void
  isContradictionDismissed: (key: string) => boolean
  updateDetectedContradictions: (contradictions: Contradiction[]) => void
}

const LinksContext = createContext<LinksContextValue | null>(null)

const EMPTY: LinksState = { confirmedLinks: [], dismissedSuggestions: [], dismissedContradictions: [], detectedContradictions: [] }

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
        // Migrate: add missing fields if absent
        setState({ dismissedContradictions: [], detectedContradictions: [], ...parsed })
      }
    } catch {}
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
        confirmLink,
        dismissSuggestion,
        removeLink,
        removeLinksByNoteId,
        isDismissed,
        isConfirmed,
        getLinksForNote,
        dismissContradiction,
        restoreContradiction,
        isContradictionDismissed,
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
