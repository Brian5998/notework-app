'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotes } from '@/lib/NotesContext'
import { useLinks, makeContradictionKey } from '@/lib/LinksContext'
import { useWorkspace, ACCENT_PALETTES } from '@/lib/WorkspaceContext'
import NotesList from '@/components/app/NotesList'
import NoteEditor from '@/components/app/NoteEditor'
import ContradictionPanel from '@/components/app/ContradictionPanel'
import SuggestionsPanel from '@/components/app/SuggestionsPanel'
import QuizPanel from '@/components/app/QuizPanel'
import CommandPalette from '@/components/app/CommandPalette'
import ContradictionSidePanel from '@/components/app/ContradictionSidePanel'
import OnboardingScreen from '@/components/app/OnboardingScreen'
import WelcomeHome from '@/components/app/WelcomeHome'

export default function AppPage() {
  const router = useRouter()
  const { notes, deleteNote: deleteNoteCtx } = useNotes()
  const {
    removeLinksByNoteId,
    isContradictionDismissed,
    confirmedLinks,
    detectedContradictions: contradictions,
    getContradictionsForNote,
  } = useLinks()
  const { isOnboarded, showQuiz, labels } = useWorkspace()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contradictionOpen, setContradictionOpen] = useState(false)
  const [showQuizPanel, setShowQuizPanel] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [showContradictionSide, setShowContradictionSide] = useState(false)
  const [distractionFree, setDistractionFree] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Global keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Cmd+K — open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      // Cmd+Shift+F — toggle distraction-free mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault()
        setDistractionFree((d) => !d)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Pick up note selected from Forest View navigation
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notework_selected_note')
      if (stored) {
        setSelectedId(stored)
        localStorage.removeItem('notework_selected_note')
      }
    } catch {}
  }, [])

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

  const handleDeleteNote = useCallback(
    (id: string) => {
      deleteNoteCtx(id)
      removeLinksByNoteId(id)
      if (selectedId === id) setSelectedId(null)
    },
    [deleteNoteCtx, removeLinksByNoteId, selectedId],
  )

  const contradictionsForNote = useMemo(
    () =>
      contradictions.filter(
        (c) =>
          c.noteIds.includes(selectedId ?? '') &&
          !isContradictionDismissed(
            makeContradictionKey(c.noteIds, c.explanation),
          ),
      ),
    [contradictions, selectedId, isContradictionDismissed],
  )

  const forestNodeIds = useMemo(
    () =>
      new Set(
        confirmedLinks.flatMap((l) => [l.sourceNoteId, l.targetNoteId]),
      ),
    [confirmedLinks],
  )

  const contradictionInForest = useMemo(
    () =>
      contradictionsForNote.some((c) =>
        c.noteIds.some((id) => forestNodeIds.has(id)),
      ),
    [contradictionsForNote, forestNodeIds],
  )

  function handleViewContradictions() {
    if (contradictionInForest) {
      const ids = [
        ...new Set(
          contradictionsForNote
            .flatMap((c) => c.noteIds)
            .filter((id) => forestNodeIds.has(id)),
        ),
      ]
      try {
        localStorage.setItem(
          'notework_conflict_highlight',
          JSON.stringify(ids),
        )
      } catch {}
      router.push('/app/forest')
    } else {
      setShowContradictionSide(true)
    }
  }

  // Show onboarding on first visit
  if (!isOnboarded) {
    return <OnboardingScreen />
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
      }}
    >
      {/* Sidebar */}
      {!distractionFree && (
        <div
          style={{
            width: 320,
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg)',
          }}
        >
          {/* Logo strip */}
          <div
            style={{
              padding: '1.15rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <a
              href="/"
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontSize: '1.75rem',
                color: 'var(--ink)',
                textDecoration: 'none',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              Note<span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>work</span>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ContradictionPanel
                notes={notes}
                onSelectNote={setSelectedId}
                isOpen={contradictionOpen}
                onOpenChange={setContradictionOpen}
              />
              <SettingsButton
                isOpen={showSettings}
                onToggle={() => setShowSettings((s) => !s)}
              />
            </div>
          </div>

          {/* Cmd+K search trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              margin: '0 1rem 0.95rem',
              padding: '0.9rem 1rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor =
                'var(--accent-mid)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor =
                'var(--border)')
            }
          >
            <svg
              viewBox="0 0 24 24"
              style={{
                width: 17,
                height: 17,
                stroke: 'var(--ink-muted)',
                fill: 'none',
                strokeWidth: 2,
                flexShrink: 0,
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span
              style={{
                flex: 1,
                fontSize: '1rem',
                color: 'var(--ink-muted)',
                textAlign: 'left',
              }}
            >
              {labels.searchPlaceholder}
            </span>
            <kbd
              style={{
                fontSize: '0.78rem',
                color: 'var(--ink-faint)',
                background: 'var(--bg-elevated-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '0.22rem 0.5rem',
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Navigation strip */}
          <div
            style={{
              display: 'flex',
              gap: '0.3rem',
              padding: '0 1rem 0.85rem',
            }}
          >
            <NavButton
              href="/app/forest"
              icon={<TreeIcon />}
              label="Forest"
            />
            <NavButton
              href="/app/timeline"
              icon={<ClockIcon />}
              label="Timeline"
            />
            <NavButton
              href="/app/insights"
              icon={<ChartIcon />}
              label="Insights"
            />
            {showQuiz && (
              <button
                onClick={() => setShowQuizPanel(true)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.8rem 0',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  color: 'var(--ink-muted)',
                  transition: 'all 0.15s',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--accent)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-mid)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                }}
              >
                <QuizIcon />
                Quiz
              </button>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid var(--border)',
            }}
          >
            <NotesList
              notes={notes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={handleDeleteNote}
              getContradictionsForNote={getContradictionsForNote}
            />
          </div>
        </div>
      )}

      {/* Main editor area */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
      >
        {selectedNote ? (
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <NoteEditor
              note={selectedNote}
              contradictions={contradictionsForNote}
              contradictionInForest={contradictionInForest}
              onViewContradictions={handleViewContradictions}
              onDelete={() => handleDeleteNote(selectedNote.id)}
              distractionFree={distractionFree}
              onToggleDistractionFree={() => setDistractionFree((d) => !d)}
            />

            {/* Contradiction side panel */}
            {showContradictionSide &&
              contradictionsForNote.length > 0 &&
              !distractionFree && (
                <ContradictionSidePanel
                  note={selectedNote}
                  contradictions={contradictionsForNote}
                  allNotes={notes}
                  onClose={() => setShowContradictionSide(false)}
                  onSelectNote={setSelectedId}
                />
              )}

            {/* Suggestions panel */}
            {!showContradictionSide && !distractionFree && (
              <SuggestionsPanel
                currentNote={selectedNote}
                otherNotes={notes.filter(
                  (n) => n.id !== selectedNote.id,
                )}
                onSelect={setSelectedId}
              />
            )}
          </div>
        ) : distractionFree ? (
          <DistractionFreeEmpty />
        ) : (
          <WelcomeHome
            onNew={setSelectedId}
            onSelect={setSelectedId}
            onOpenQuiz={() => setShowQuizPanel(true)}
            onOpenInsights={() => router.push('/app/insights')}
          />
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        notes={notes}
        onSelect={setSelectedId}
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {showQuizPanel && (
        <QuizPanel notes={notes} onClose={() => setShowQuizPanel(false)} />
      )}

      {/* Distraction-free mode indicator */}
      {distractionFree && (
        <button
          onClick={() => setDistractionFree(false)}
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border)',
            borderRadius: 8,
            padding: '0.3rem 0.6rem',
            fontSize: '0.68rem',
            color: 'var(--ink-faint)',
            cursor: 'pointer',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            opacity: 0.5,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.opacity = '1')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.opacity = '0.5')
          }
        >
          <svg
            viewBox="0 0 24 24"
            style={{
              width: 11,
              height: 11,
              stroke: 'currentColor',
              fill: 'none',
              strokeWidth: 2,
            }}
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
          Exit focus · ⌘⇧F
        </button>
      )}
    </div>
  )
}

function DistractionFreeEmpty() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        color: 'var(--ink-muted)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        style={{
          width: 56,
          height: 56,
          stroke: 'var(--ink-faint)',
          fill: 'none',
          strokeWidth: 1,
        }}
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <p style={{ fontSize: '1.15rem' }}>Press ⌘⇧F to exit focus mode</p>
    </div>
  )
}

function NavButton({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.8rem 0',
        textDecoration: 'none',
        color: 'var(--ink-muted)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        transition: 'all 0.15s',
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.color = 'var(--accent)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-mid)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
      }}
    >
      {icon}
      {label}
    </Link>
  )
}

function TreeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{
        width: 17,
        height: 17,
        stroke: 'currentColor',
        fill: 'none',
        strokeWidth: 1.4,
      }}
    >
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <line x1="12" y1="7.5" x2="5.5" y2="16.5" />
      <line x1="12" y1="7.5" x2="18.5" y2="16.5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{
        width: 17,
        height: 17,
        stroke: 'currentColor',
        fill: 'none',
        strokeWidth: 1.4,
      }}
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{
        width: 17,
        height: 17,
        stroke: 'currentColor',
        fill: 'none',
        strokeWidth: 1.4,
      }}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function QuizIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{
        width: 17,
        height: 17,
        stroke: 'currentColor',
        fill: 'none',
        strokeWidth: 1.4,
      }}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function SettingsButton({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { workspaceType, setWorkspaceType, accentColor, setAccentColor } = useWorkspace()
  const options = [
    { type: 'student' as const, label: 'Student', icon: '✦' },
    { type: 'researcher' as const, label: 'Researcher', icon: '◇' },
    { type: 'professional' as const, label: 'Professional', icon: '◈' },
  ]
  const colorOrder = (Object.keys(ACCENT_PALETTES) as (keyof typeof ACCENT_PALETTES)[])

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        title="Settings"
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0.3rem 0.45rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--ink-muted)',
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: 'currentColor', fill: 'none', strokeWidth: 1.6 }}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 190 }} onClick={onToggle} />
          <div
            style={{
              position: 'absolute',
              top: '125%',
              right: 0,
              width: 260,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 14,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              zIndex: 200,
              overflow: 'hidden',
              padding: '0.6rem 0',
            }}
          >
            <div style={{ padding: '0.5rem 0.95rem 0.35rem', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              Workspace Mode
            </div>
            {options.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setWorkspaceType(opt.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  width: '100%',
                  padding: '0.55rem 0.95rem',
                  background: workspaceType === opt.type ? 'var(--accent-light)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  color: workspaceType === opt.type ? 'var(--accent)' : 'var(--ink)',
                  textAlign: 'left',
                  fontWeight: workspaceType === opt.type ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (workspaceType !== opt.type) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated-2)'
                }}
                onMouseLeave={(e) => {
                  if (workspaceType !== opt.type) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <span style={{ color: 'var(--accent)', fontSize: '1.1rem', width: 18 }}>{opt.icon}</span>
                {opt.label}
                {workspaceType === opt.type && (
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'var(--accent)', fill: 'none', strokeWidth: 2.5, marginLeft: 'auto' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '0.5rem 0.95rem' }} />

            <div style={{ padding: '0.5rem 0.95rem 0.35rem', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              Accent Color
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', padding: '0.35rem 0.95rem 0.75rem' }}>
              {colorOrder.map((c) => {
                const palette = ACCENT_PALETTES[c]
                const isActive = accentColor === c
                return (
                  <button
                    key={c}
                    onClick={() => setAccentColor(c)}
                    title={palette.name}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: palette.accent,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: isActive ? `0 0 0 3px var(--bg-elevated), 0 0 0 5px ${palette.accent}` : 'none',
                      transition: 'all 0.15s',
                      padding: 0,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
