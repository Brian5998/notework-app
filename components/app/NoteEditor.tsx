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
      {/* Top bar — date + consistency pill + Edit/Preview toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem', gap: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>{date}</div>
          <ConsistencyPill
            count={contradictions.length}
            onClick={onViewContradictions}
            inForest={contradictionInForest}
          />
        </div>
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

function ConsistencyPill({
  count,
  onClick,
  inForest,
}: {
  count: number
  onClick: () => void
  inForest?: boolean
}) {
  const isClean = count === 0
  const color = isClean ? 'var(--accent)' : '#ef4444'
  const bg = isClean ? 'var(--accent-light)' : 'rgba(239,68,68,0.12)'
  const border = isClean ? 'var(--accent-mid)' : 'rgba(239,68,68,0.45)'

  return (
    <button
      onClick={isClean ? undefined : onClick}
      title={
        isClean
          ? 'No contradictions detected in this note'
          : `${count} contradiction${count === 1 ? '' : 's'} — click to review`
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.35rem 0.75rem',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 99,
        color,
        fontSize: '0.85rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        cursor: isClean ? 'default' : 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          flexShrink: 0,
        }}
      />
      {isClean
        ? 'Consistent'
        : `${count} conflict${count === 1 ? '' : 's'}${inForest ? ' · view in Forest' : ''}`}
    </button>
  )
}
