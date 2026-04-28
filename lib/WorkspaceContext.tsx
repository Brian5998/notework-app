'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type WorkspaceType = 'student' | 'researcher' | 'professional'
export type AccentColor = 'forest' | 'ocean' | 'amber' | 'rose' | 'violet' | 'mono'

const STORAGE_KEY = 'notework_workspace_type'
const COLOR_KEY = 'notework_accent_color'
const NAME_KEY = 'notework_user_name'

type WorkspaceLabels = {
  noteType: string
  addAction: string
  groupLabel: string
  emptyPrompt: string
  gapAdvice: string
  searchPlaceholder: string
}

const LABELS: Record<WorkspaceType, WorkspaceLabels> = {
  student: {
    noteType: 'lecture note',
    addAction: 'Add a class',
    groupLabel: 'Courses',
    emptyPrompt: 'Start by adding your first lecture note or class material.',
    gapAdvice: 'Study these concepts — they appear often but have no confirmed connections yet.',
    searchPlaceholder: 'Search your notes...',
  },
  researcher: {
    noteType: 'research note',
    addAction: 'Add a project',
    groupLabel: 'Projects',
    emptyPrompt: 'Start by adding your first research note or paper summary.',
    gapAdvice: 'These topics appear across your notes but lack supporting links in your literature.',
    searchPlaceholder: 'Search your research...',
  },
  professional: {
    noteType: 'note',
    addAction: 'Add a client',
    groupLabel: 'Clients',
    emptyPrompt: 'Start by adding notes from your first meeting or engagement.',
    gapAdvice: 'These topics lack supporting evidence in your notes — consider documenting them.',
    searchPlaceholder: 'Search your notes...',
  },
}

export const ACCENT_PALETTES: Record<AccentColor, { name: string; accent: string; light: string; mid: string; glow: string }> = {
  forest: {
    name: 'Forest',
    accent: '#5CB87A',
    light: 'rgba(92, 184, 122, 0.12)',
    mid: 'rgba(92, 184, 122, 0.4)',
    glow: 'rgba(92, 184, 122, 0.25)',
  },
  ocean: {
    name: 'Ocean',
    accent: '#6FA5C9',
    light: 'rgba(111, 165, 201, 0.14)',
    mid: 'rgba(111, 165, 201, 0.4)',
    glow: 'rgba(111, 165, 201, 0.28)',
  },
  amber: {
    name: 'Amber',
    accent: '#E0B05A',
    light: 'rgba(224, 176, 90, 0.14)',
    mid: 'rgba(224, 176, 90, 0.4)',
    glow: 'rgba(224, 176, 90, 0.3)',
  },
  rose: {
    name: 'Rose',
    accent: '#D88A9A',
    light: 'rgba(216, 138, 154, 0.13)',
    mid: 'rgba(216, 138, 154, 0.4)',
    glow: 'rgba(216, 138, 154, 0.28)',
  },
  violet: {
    name: 'Violet',
    accent: '#A18ACA',
    light: 'rgba(161, 138, 202, 0.14)',
    mid: 'rgba(161, 138, 202, 0.4)',
    glow: 'rgba(161, 138, 202, 0.28)',
  },
  mono: {
    name: 'Mono',
    accent: '#E6E3D9',
    light: 'rgba(230, 227, 217, 0.08)',
    mid: 'rgba(230, 227, 217, 0.3)',
    glow: 'rgba(230, 227, 217, 0.18)',
  },
}

type WorkspaceContextValue = {
  workspaceType: WorkspaceType | null
  setWorkspaceType: (type: WorkspaceType) => void
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
  userName: string
  setUserName: (name: string) => void
  labels: WorkspaceLabels
  isOnboarded: boolean
  showQuiz: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function applyAccentColor(color: AccentColor) {
  if (typeof document === 'undefined') return
  const palette = ACCENT_PALETTES[color]
  const root = document.documentElement
  root.style.setProperty('--accent', palette.accent)
  root.style.setProperty('--accent-light', palette.light)
  root.style.setProperty('--accent-mid', palette.mid)
  root.style.setProperty('--accent-glow', palette.glow)
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceType, setWorkspaceTypeState] = useState<WorkspaceType | null>(null)
  const [accentColor, setAccentColorState] = useState<AccentColor>('forest')
  const [userName, setUserNameState] = useState<string>('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as WorkspaceType | null
      if (stored && ['student', 'researcher', 'professional'].includes(stored)) {
        setWorkspaceTypeState(stored)
      }
      const storedColor = localStorage.getItem(COLOR_KEY) as AccentColor | null
      if (storedColor && storedColor in ACCENT_PALETTES) {
        setAccentColorState(storedColor)
        applyAccentColor(storedColor)
      } else {
        applyAccentColor('forest')
      }
      const storedName = localStorage.getItem(NAME_KEY)
      if (storedName) setUserNameState(storedName)
    } catch {}
    setLoaded(true)
  }, [])

  const setWorkspaceType = useCallback((type: WorkspaceType) => {
    setWorkspaceTypeState(type)
    localStorage.setItem(STORAGE_KEY, type)
  }, [])

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem(COLOR_KEY, color)
    applyAccentColor(color)
  }, [])

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim()
    setUserNameState(trimmed)
    try {
      if (trimmed) localStorage.setItem(NAME_KEY, trimmed)
      else localStorage.removeItem(NAME_KEY)
    } catch {}
  }, [])

  const labels = LABELS[workspaceType ?? 'student']
  const isOnboarded = workspaceType !== null
  const showQuiz = workspaceType === 'student' || workspaceType === null

  if (!loaded) return null

  return (
    <WorkspaceContext.Provider
      value={{
        workspaceType,
        setWorkspaceType,
        accentColor,
        setAccentColor,
        userName,
        setUserName,
        labels,
        isOnboarded,
        showQuiz,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
