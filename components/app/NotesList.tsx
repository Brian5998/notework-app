'use client'

import { useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useNotes } from '@/lib/NotesContext'
import { useLinks } from '@/lib/LinksContext'
import { Note } from '@/lib/types'

const DrivePickerModal = dynamic(() => import('./DrivePickerModal'), { ssr: false })
const RecordingPanel = dynamic(() => import('./RecordingPanel'), { ssr: false })

const FOREST_THRESHOLD = 3
type SortOrder = 'newest' | 'oldest' | 'az'

type Props = {
  notes: Note[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
}

export default function NotesList({ notes, selectedId, onSelect, onDelete }: Props) {
  const { addNote, deleteNote } = useNotes()
  const handleDelete = onDelete ?? deleteNote
  const { confirmedLinks } = useLinks()
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [filterQuery, setFilterQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadLabel, setUploadLabel] = useState('Uploading…')
  const [showDrivePicker, setShowDrivePicker] = useState(false)
  const [showRecording, setShowRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  function handleNewFromScratch() {
    setMenuOpen(false)
    const note = addNote('Untitled', '')
    onSelect(note.id)
  }

  function handleUploadClick() {
    setMenuOpen(false)
    fileInputRef.current?.click()
  }

  function handleScanClick() {
    setMenuOpen(false)
    imageInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setUploadLabel('Uploading…')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const note = addNote(data.title || file.name, data.content || '')
      onSelect(note.id)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Could not parse the file. Please try another.')
    } finally {
      setUploading(false)
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setUploadLabel('Reading handwriting…')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('mode', 'handwriting')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const note = addNote(data.title || file.name, data.content || '')
      onSelect(note.id)
    } catch (err) {
      console.error('Handwriting scan failed:', err)
      alert('Could not read the handwritten notes. Please try a clearer image.')
    } finally {
      setUploading(false)
    }
  }

  function cycleSortOrder() {
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'az' : 'newest'))
  }

  const sortLabel: Record<SortOrder, string> = { newest: 'Newest', oldest: 'Oldest', az: 'A–Z' }

  const displayedNotes = useMemo(() => {
    let result = notes
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase()
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      )
    }
    if (sortOrder === 'newest') return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sortOrder === 'oldest') return [...result].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return [...result].sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'))
  }, [notes, sortOrder, filterQuery])

  const linkCount = confirmedLinks.length
  const forestUnlocked = linkCount >= FOREST_THRESHOLD

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" style={{ display: 'none' }} onChange={handleFileChange} />
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp" capture="environment" style={{ display: 'none' }} onChange={handleImageChange} />

      {/* Drive picker modal */}
      {showDrivePicker && (
        <DrivePickerModal
          onClose={() => setShowDrivePicker(false)}
          onImport={(title, content) => {
            const note = addNote(title, content)
            onSelect(note.id)
          }}
        />
      )}

      {/* Recording modal */}
      {showRecording && (
        <RecordingPanel
          onClose={() => setShowRecording(false)}
          onSave={(noteTitle, content) => {
            const note = addNote(noteTitle, content)
            onSelect(note.id)
            setShowRecording(false)
          }}
        />
      )}

      {/* Header row */}
      <div
        style={{
          padding: '0.6rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '0.5px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          Notes ({notes.length})
        </span>
        <button
          onClick={cycleSortOrder}
          style={{ background: 'none', border: '0.5px solid var(--border)', borderRadius: 4, padding: '0.15rem 0.45rem', fontSize: '0.65rem', color: 'var(--ink-faint)', cursor: 'pointer', letterSpacing: '0.03em' }}
        >
          {sortLabel[sortOrder]}
        </button>
      </div>

      {/* Filter input */}
      <div
        style={{
          padding: '0.5rem 1rem',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, stroke: 'var(--ink-faint)', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter notes…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.78rem', color: 'var(--ink)', minWidth: 0 }}
        />
        {filterQuery && (
          <button onClick={() => setFilterQuery('')} style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: 0 }}>
            ×
          </button>
        )}
      </div>

      {/* Notes list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayedNotes.length === 0 && (
          <p style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--ink-faint)', textAlign: 'center' }}>
            {filterQuery ? 'No notes match.' : 'No notes yet. Create your first one.'}
          </p>
        )}
        {displayedNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => onSelect(note.id)}
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              borderLeft: selectedId === note.id ? '2px solid var(--accent)' : '2px solid transparent',
              background: selectedId === note.id ? 'var(--accent-light)' : 'transparent',
              transition: 'background 0.15s',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {note.title || 'Untitled'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {note.content.slice(0, 60) || 'Empty note'}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
              title="Delete"
              style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '0.9rem', padding: '0 2px', lineHeight: 1, opacity: 0.5 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* New Note button with upward dropdown */}
      <div style={{ flexShrink: 0, padding: '0.75rem 1rem', borderTop: '0.5px solid var(--border)', position: 'relative' }}>
        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% - 0.25rem)',
                left: '1rem',
                right: '1rem',
                zIndex: 20,
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border)',
                borderRadius: 10,
                boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}
            >
              <button onClick={handleNewFromScratch} style={menuItemStyle} onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)')} onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Create from scratch
              </button>
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 0.75rem' }} />
              <button onClick={handleUploadClick} style={menuItemStyle} onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)')} onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload file (PDF, TXT, MD)
              </button>
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 0.75rem' }} />
              <button onClick={handleScanClick} style={menuItemStyle} onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)')} onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
                Scan handwritten notes
              </button>
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 0.75rem' }} />
              <button onClick={() => { setMenuOpen(false); setShowRecording(true) }} style={menuItemStyle} onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)')} onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Record audio
              </button>
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 0.75rem' }} />
              <button onClick={() => { setMenuOpen(false); setShowDrivePicker(true) }} style={menuItemStyle} onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)')} onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                </svg>
                Connect Google Drive
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '0.7rem 1rem',
            background: uploading ? 'var(--ink-faint)' : 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: '0.78rem',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: uploading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'background 0.15s',
          }}
        >
          {uploading ? uploadLabel : '+ New Note'}
        </button>
      </div>

      {/* Forest View tab */}
      <div style={{ flexShrink: 0, borderTop: '0.5px solid var(--border)', padding: '0.75rem 1rem' }}>
        {forestUnlocked ? (
          <Link
            href="/app/forest"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              background: 'var(--accent-light)',
              borderRadius: 8,
              textDecoration: 'none',
              color: 'var(--accent)',
              fontSize: '0.82rem',
              fontWeight: 500,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🌲</span> Forest View
            </span>
            <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, stroke: 'var(--accent)', fill: 'none', strokeWidth: 2.5 }}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        ) : (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 8,
              border: '0.5px solid var(--border)',
              color: 'var(--ink-faint)',
              fontSize: '0.82rem',
              cursor: 'not-allowed',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ opacity: 0.5 }}>🌲</span> Forest View
              </span>
              <span style={{ fontSize: '0.7rem' }}>{linkCount} / {FOREST_THRESHOLD}</span>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min((linkCount / FOREST_THRESHOLD) * 100, 100)}%`,
                  background: 'var(--accent)',
                  borderRadius: 99,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  width: '100%',
  padding: '0.65rem 0.9rem',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.85rem',
  color: 'var(--ink)',
  textAlign: 'left',
}
