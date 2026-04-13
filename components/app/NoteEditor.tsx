'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useNotes } from '@/lib/NotesContext'
import { Note, Contradiction } from '@/lib/types'

const NoteRenderer = dynamic(() => import('./NoteRenderer'), { ssr: false })

type Props = {
  note: Note
  contradictions: Contradiction[]
  onViewContradictions: () => void
  contradictionInForest?: boolean
  onDelete?: () => void
}

export default function NoteEditor({ note, contradictions, onViewContradictions, contradictionInForest, onDelete }: Props) {
  const { updateNote } = useNotes()
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveLabel, setSaveLabel] = useState('')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset delete confirmation when note changes
  useEffect(() => { setConfirmingDelete(false) }, [note.id])

  const handleDeleteClick = useCallback(() => {
    if (!onDelete) return
    if (confirmingDelete) {
      onDelete()
    } else {
      setConfirmingDelete(true)
      deleteTimer.current = setTimeout(() => setConfirmingDelete(false), 3000)
    }
  }, [confirmingDelete, onDelete])

  useEffect(() => () => { if (deleteTimer.current) clearTimeout(deleteTimer.current) }, [])

  // Sync when a different note is selected
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setSavedAt(null)
  }, [note.id])

  // Update save label every second
  useEffect(() => {
    if (savedAt === null) { setSaveLabel(''); return }
    function update() {
      if (savedAt === null) return
      const secs = Math.floor((Date.now() - savedAt) / 1000)
      if (secs < 5) setSaveLabel('Saved just now')
      else if (secs < 60) setSaveLabel(`Saved ${secs}s ago`)
      else setSaveLabel(`Saved ${Math.floor(secs / 60)}m ago`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [savedAt])

  // Cmd+S handler
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (saveTimer.current) clearTimeout(saveTimer.current)
        updateNote(note.id, { title, content })
        setSavedAt(Date.now())
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [note.id, title, content, updateNote])

  function scheduleAutoSave(newTitle: string, newContent: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateNote(note.id, { title: newTitle, content: newContent })
      setSavedAt(Date.now())
    }, 500)
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    scheduleAutoSave(val, content)
  }

  function handleContentChange(val: string) {
    setContent(val)
    scheduleAutoSave(title, val)
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  const date = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem',
        overflowY: 'auto',
        minWidth: 0,
      }}
    >
      {/* Date + Edit/Preview toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>{date}</div>
        <div style={{ display: 'flex', border: '0.5px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          {(['edit', 'preview'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '0.2rem 0.65rem',
                fontSize: '0.7rem',
                border: 'none',
                cursor: 'pointer',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--ink-faint)',
                textTransform: 'capitalize',
                letterSpacing: '0.03em',
                transition: 'background 0.15s',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Contradiction banner */}
      {contradictions.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 0.85rem',
            marginBottom: '1rem',
            borderLeft: '3px solid #F59E0B',
            background: 'rgba(245,158,11,0.08)',
            borderRadius: '0 6px 6px 0',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: '#F59E0B', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            This note conflicts with {contradictions.length} other {contradictions.length === 1 ? 'note' : 'notes'}.
          </span>
          <button
            onClick={onViewContradictions}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.75rem',
              color: contradictionInForest ? '#5CB87A' : '#F59E0B',
              cursor: 'pointer',
              fontWeight: 500,
              padding: '0 0.25rem',
              whiteSpace: 'nowrap',
            }}
          >
            {contradictionInForest ? 'View in Forest →' : 'View →'}
          </button>
        </div>
      )}

      {/* Title */}
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Untitled"
        style={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontSize: '1.8rem',
          fontWeight: 400,
          color: 'var(--ink)',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          width: '100%',
          marginBottom: '1.25rem',
          letterSpacing: '-0.02em',
        }}
      />

      {/* Content — Edit or Preview */}
      {mode === 'edit' ? (
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing…"
          style={{
            flex: 1,
            fontSize: '0.95rem',
            color: 'var(--ink)',
            lineHeight: 1.8,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            width: '100%',
            minHeight: 320,
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          }}
        />
      ) : (
        <div style={{ flex: 1, minHeight: 320, paddingBottom: '1rem' }}>
          <NoteRenderer content={content} />
        </div>
      )}

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '0.5px solid var(--border)',
          fontSize: '0.7rem',
          color: 'var(--ink-faint)',
        }}
      >
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        {saveLabel && <span>{saveLabel}</span>}
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: confirmingDelete ? '0.5px solid var(--conflict)' : 'none',
              borderRadius: 4,
              padding: confirmingDelete ? '0.1rem 0.4rem' : '0.1rem 0',
              fontSize: '0.7rem',
              color: confirmingDelete ? 'var(--conflict)' : 'var(--ink-faint)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {confirmingDelete ? 'Confirm delete?' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  )
}
