'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotes } from '@/lib/NotesContext'
import { useLinks, makeContradictionKey } from '@/lib/LinksContext'
import NotesList from '@/components/app/NotesList'
import NoteEditor from '@/components/app/NoteEditor'
import SearchBar from '@/components/app/SearchBar'
import SearchResults from '@/components/app/SearchResults'
import ContradictionPanel from '@/components/app/ContradictionPanel'
import SuggestionsPanel from '@/components/app/SuggestionsPanel'
import QuizPanel from '@/components/app/QuizPanel'
type SearchResult = { id: string; reason: string }

export default function AppPage() {
  const router = useRouter()
  const { notes, addNote, deleteNote: deleteNoteCtx } = useNotes()
  const { removeLinksByNoteId, isContradictionDismissed, confirmedLinks, detectedContradictions: contradictions } = useLinks()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [contradictionOpen, setContradictionOpen] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)

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

  // Delete note + clean up its links
  const handleDeleteNote = useCallback(
    (id: string) => {
      deleteNoteCtx(id)
      removeLinksByNoteId(id)
      if (selectedId === id) setSelectedId(null)
    },
    [deleteNoteCtx, removeLinksByNoteId, selectedId]
  )

  // Active (non-dismissed) contradictions for the currently selected note
  const contradictionsForNote = useMemo(
    () => contradictions.filter(
      (c) =>
        c.noteIds.includes(selectedId ?? '') &&
        !isContradictionDismissed(makeContradictionKey(c.noteIds, c.explanation))
    ),
    [contradictions, selectedId, isContradictionDismissed]
  )

  // IDs of notes that appear in the Forest (have at least one confirmed link)
  const forestNodeIds = useMemo(
    () => new Set(confirmedLinks.flatMap((l) => [l.sourceNoteId, l.targetNoteId])),
    [confirmedLinks]
  )

  // True if any conflicting note for the current selection is in the Forest
  const contradictionInForest = useMemo(
    () => contradictionsForNote.some((c) => c.noteIds.some((id) => forestNodeIds.has(id))),
    [contradictionsForNote, forestNodeIds]
  )

  function handleViewContradictions() {
    if (contradictionInForest) {
      // Collect all conflicting note IDs that are in the forest
      const ids = [...new Set(contradictionsForNote.flatMap((c) => c.noteIds).filter((id) => forestNodeIds.has(id)))]
      try { localStorage.setItem('notework_conflict_highlight', JSON.stringify(ids)) } catch {}
      router.push('/app/forest')
    } else {
      setContradictionOpen(true)
    }
  }

  async function handleSearch(query: string) {
    if (!query.trim()) { setSearchResults(null); return }
    setIsSearching(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, notes }),
      })
      const data = await res.json()
      setSearchResults(data.results ?? [])
    } finally {
      setIsSearching(false)
    }
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
      <div
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: '0.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
        }}
      >
        {/* Logo strip */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '0.5px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <a
            href="/"
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: '1.1rem',
              color: 'var(--ink)',
              textDecoration: 'none',
            }}
          >
            Note<span style={{ color: 'var(--accent)' }}>work</span>
          </a>
          <ContradictionPanel
            notes={notes}
            onSelectNote={setSelectedId}
            isOpen={contradictionOpen}
            onOpenChange={setContradictionOpen}
          />
        </div>

        <SearchBar onSearch={handleSearch} onClear={() => setSearchResults(null)} isSearching={isSearching} />

        {/* Navigation strip */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            borderBottom: '0.5px solid var(--border)',
            padding: '0 0.5rem',
          }}
        >
          <NavButton href="/app/forest" icon={<TreeIcon />} label="Forest" />
          <NavButton href="/app/timeline" icon={<ClockIcon />} label="Timeline" />
          <NavButton href="/app/insights" icon={<ChartIcon />} label="Insights" />
          <button
            onClick={() => setShowQuiz(true)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.15rem',
              padding: '0.5rem 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-faint)',
              transition: 'color 0.15s',
              fontSize: '0.6rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-faint)' }}
          >
            <QuizIcon />
            Quiz
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {searchResults !== null ? (
            <SearchResults
              results={searchResults}
              notes={notes}
              onSelect={(id) => { setSelectedId(id); setSearchResults(null) }}
            />
          ) : (
            <NotesList
              notes={notes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={handleDeleteNote}
            />
          )}
        </div>
      </div>

      {/* Main editor area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedNote ? (
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <NoteEditor
              note={selectedNote}
              contradictions={contradictionsForNote}
              contradictionInForest={contradictionInForest}
              onViewContradictions={handleViewContradictions}
              onDelete={() => handleDeleteNote(selectedNote.id)}
            />
            <SuggestionsPanel
              currentNote={selectedNote}
              otherNotes={notes.filter((n) => n.id !== selectedNote.id)}
              onSelect={setSelectedId}
            />
          </div>
        ) : (
          <EmptyState onNew={setSelectedId} />
        )}
      </div>

      {showQuiz && <QuizPanel notes={notes} onClose={() => setShowQuiz(false)} />}
    </div>
  )
}

function EmptyState({ onNew }: { onNew: (id: string) => void }) {
  const { addNote } = useNotes()
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: 'var(--ink-faint)',
      }}
    >
      <svg viewBox="0 0 24 24" style={{ width: 40, height: 40, stroke: 'var(--ink-faint)', fill: 'none', strokeWidth: 1.2 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      <p style={{ fontSize: '0.9rem' }}>Select a note or create a new one</p>
      <button
        onClick={() => { const note = addNote('Untitled', ''); onNew(note.id) }}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 100,
          padding: '0.5rem 1.25rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
        }}
      >
        New note
      </button>
    </div>
  )
}

function NavButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.15rem',
        padding: '0.5rem 0',
        textDecoration: 'none',
        color: 'var(--ink-faint)',
        transition: 'color 0.15s',
        fontSize: '0.6rem',
        fontWeight: 500,
        letterSpacing: '0.04em',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-faint)' }}
    >
      {icon}
      {label}
    </Link>
  )
}

function TreeIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 1.5 }}>
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <line x1="12" y1="8" x2="5" y2="16" />
      <line x1="12" y1="8" x2="19" y2="16" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 1.5 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 1.5 }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function QuizIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 1.5 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
