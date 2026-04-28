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
  distractionFree?: boolean
  onToggleDistractionFree?: () => void
}

export default function NoteEditor({ note, contradictions, onViewContradictions, contradictionInForest, onDelete, distractionFree, onToggleDistractionFree }: Props) {
  const { updateNote } = useNotes()
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [tags, setTags] = useState<string[]>(note.tags ?? [])
  const [tagInput, setTagInput] = useState('')
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
    setTags(note.tags ?? [])
    setTagInput('')
    setSavedAt(null)
  }, [note.id, note.tags])

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

  function addTag(raw: string) {
    const cleaned = raw.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-').slice(0, 24)
    if (!cleaned) return
    if (tags.includes(cleaned)) return
    const next = [...tags, cleaned]
    setTags(next)
    setTagInput('')
    updateNote(note.id, { tags: next })
    setSavedAt(Date.now())
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t)
    setTags(next)
    updateNote(note.id, { tags: next })
    setSavedAt(Date.now())
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
        padding: distractionFree ? '3.5rem 5rem' : '2.5rem 3rem',
        overflowY: 'auto',
        minWidth: 0,
        maxWidth: distractionFree ? 880 : 920,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Date + Edit/Preview toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
        <div style={{ fontSize: '0.95rem', color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>{date}</div>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {(['edit', 'preview'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '0.5rem 1.15rem',
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#0E0E0C' : 'var(--ink-muted)',
                textTransform: 'capitalize',
                letterSpacing: '0.02em',
                fontWeight: mode === m ? 600 : 500,
                transition: 'all 0.15s',
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
            padding: '0.85rem 1.1rem',
            marginBottom: '1.25rem',
            borderLeft: '3px solid var(--warning)',
            background: 'rgba(224, 176, 90, 0.08)',
            borderRadius: '0 8px 8px 0',
          }}
        >
          <span style={{ fontSize: '0.95rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'var(--warning)', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
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
              fontSize: '0.9rem',
              color: contradictionInForest ? 'var(--accent)' : 'var(--warning)',
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
          fontSize: distractionFree ? '3rem' : '2.5rem',
          fontWeight: 400,
          color: 'var(--ink)',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          width: '100%',
          marginBottom: '0.85rem',
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
        }}
      />

      {/* Tags row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          marginBottom: '1.5rem',
          alignItems: 'center',
        }}
      >
        {tags.map((t) => (
          <span
            key={t}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.82rem',
              padding: '0.25rem 0.65rem',
              borderRadius: 99,
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-mid)',
              fontWeight: 500,
            }}
          >
            #{t}
            <button
              onClick={() => removeTag(t)}
              aria-label={`Remove ${t}`}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                padding: 0,
                fontSize: '0.95rem',
                lineHeight: 1,
                opacity: 0.6,
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag(tagInput)
            } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
              removeTag(tags[tags.length - 1])
            }
          }}
          onBlur={() => tagInput && addTag(tagInput)}
          placeholder={tags.length === 0 ? '+ add tag' : '+ add'}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--ink-muted)',
            fontSize: '0.82rem',
            padding: '0.25rem 0.5rem',
            minWidth: 80,
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Content — Edit or Preview */}
      {mode === 'edit' ? (
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing…"
          style={{
            flex: 1,
            fontSize: distractionFree ? '1.2rem' : '1.1rem',
            color: 'var(--ink)',
            lineHeight: 1.85,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            width: '100%',
            minHeight: 380,
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
          }}
        />
      ) : (
        <div style={{ flex: 1, minHeight: 380, paddingBottom: '1rem', fontSize: distractionFree ? '1.2rem' : '1.1rem' }}>
          <NoteRenderer content={content} />
        </div>
      )}

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          marginTop: '1rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.92rem',
          color: 'var(--ink-faint)',
        }}
      >
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        {saveLabel && <span>{saveLabel}</span>}
        {onToggleDistractionFree && (
          <button
            onClick={onToggleDistractionFree}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.92rem',
              color: 'var(--ink-faint)',
              cursor: 'pointer',
              padding: 0,
            }}
            title={distractionFree ? 'Exit focus mode (⌘⇧F)' : 'Focus mode (⌘⇧F)'}
          >
            {distractionFree ? 'Exit focus' : 'Focus mode'}
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: confirmingDelete ? '1px solid var(--conflict)' : 'none',
              borderRadius: 8,
              padding: confirmingDelete ? '0.3rem 0.75rem' : '0.3rem 0',
              fontSize: '0.92rem',
              color: confirmingDelete ? 'var(--conflict)' : 'var(--ink-faint)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontWeight: 500,
            }}
          >
            {confirmingDelete ? 'Confirm delete?' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  )
}
