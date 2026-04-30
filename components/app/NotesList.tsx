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
  getContradictionsForNote?: (noteId: string) => { noteIds: string[]; explanation: string }[]
}

export default function NotesList({ notes, selectedId, onSelect, onDelete, getContradictionsForNote }: Props) {
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
          padding: '1rem 1.15rem 0.65rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
          Notes · {notes.length}
        </span>
        <button
          onClick={cycleSortOrder}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0.35rem 0.75rem',
            fontSize: '0.85rem',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            fontWeight: 500,
          }}
        >
          {sortLabel[sortOrder]}
        </button>
      </div>

      {/* Filter input */}
      <div
        style={{
          margin: '0 1rem 0.85rem',
          padding: '0.7rem 0.9rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'var(--ink-faint)', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter notes…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem', color: 'var(--ink)', minWidth: 0 }}
        />
        {filterQuery && (
          <button onClick={() => setFilterQuery('')} style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1.05rem', lineHeight: 1, padding: 0 }}>
            ×
          </button>
        )}
      </div>

      {/* Notes list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem' }}>
        {displayedNotes.length === 0 && (
          <div
            style={{
              padding: '1.75rem 1rem',
              fontSize: '0.95rem',
              color: 'var(--ink-faint)',
              textAlign: 'center',
              lineHeight: 1.55,
            }}
          >
            {filterQuery ? (
              <>
                No notes match <strong style={{ color: 'var(--ink-muted)' }}>&ldquo;{filterQuery}&rdquo;</strong>.
                <br />
                <button
                  onClick={() => setFilterQuery('')}
                  style={{
                    marginTop: '0.65rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--ink-muted)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear filter
                </button>
              </>
            ) : (
              <>
                No notes yet.
                <br />
                <span style={{ color: 'var(--ink-muted)' }}>Hit </span>
                <kbd
                  style={{
                    display: 'inline-block',
                    padding: '0.1rem 0.45rem',
                    borderRadius: 6,
                    background: 'var(--bg-elevated-2)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    color: 'var(--ink-muted)',
                    margin: '0 0.2rem',
                  }}
                >
                  + New Note
                </kbd>{' '}
                <span style={{ color: 'var(--ink-muted)' }}>below to start.</span>
              </>
            )}
          </div>
        )}
        {displayedNotes.map((note, idx) => {
          const conflictCount = getContradictionsForNote?.(note.id).length ?? 0
          const isSelected = selectedId === note.id
          return (
            <div
              key={note.id}
              onClick={() => onSelect(note.id)}
              style={{
                padding: '0.85rem 0.95rem',
                marginBottom: '0.25rem',
                cursor: 'pointer',
                borderRadius: 10,
                background: isSelected ? 'var(--bg-elevated-2)' : 'transparent',
                border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '0.5rem',
                animation: `fadeUpIn 0.25s ease-out ${Math.min(idx * 0.025, 0.3)}s both`,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, lineHeight: 1.3 }}>
                    {note.title || 'Untitled'}
                  </div>
                  {conflictCount > 0 && (
                    <span
                      title={`${conflictCount} conflict${conflictCount !== 1 ? 's' : ''}`}
                      style={{
                        flexShrink: 0,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--warning)',
                        background: 'rgba(224, 176, 90, 0.1)',
                        border: '1px solid rgba(224, 176, 90, 0.25)',
                        borderRadius: 99,
                        padding: '0.1rem 0.45rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      ⚠ {conflictCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.45 }}>
                  {note.content.slice(0, 70).replace(/\n/g, ' ') || 'Empty note'}
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                    {note.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: 99,
                          background: 'var(--bg-elevated-2)',
                          color: 'var(--ink-faint)',
                          border: '1px solid var(--border)',
                          fontWeight: 500,
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', padding: '0.1rem 0.2rem' }}>
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                title="Delete"
                style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1.05rem', padding: '0 2px', lineHeight: 1, opacity: 0.4 }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.4')}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      {/* New Note button with upward dropdown */}
      <div style={{ flexShrink: 0, padding: '0.85rem 1rem', borderTop: '1px solid var(--border)', position: 'relative' }}>
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
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                borderRadius: 12,
                boxShadow: '0 -12px 32px rgba(0,0,0,0.45)',
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
            padding: '1rem 1rem',
            background: uploading ? 'var(--ink-dim)' : 'var(--accent)',
            color: '#0E0E0C',
            border: 'none',
            borderRadius: 12,
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: uploading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            transition: 'background 0.15s',
            boxShadow: uploading ? 'none' : '0 0 24px var(--accent-glow)',
          }}
        >
          {uploading ? uploadLabel : '+ New Note'}
        </button>
      </div>

      {/* Forest View tab */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '0.95rem 1rem' }}>
        {forestUnlocked ? (
          <Link
            href="/app/forest"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: 'var(--accent-light)',
              borderRadius: 12,
              textDecoration: 'none',
              color: 'var(--accent)',
              fontSize: '1.05rem',
              fontWeight: 600,
              border: '1px solid var(--accent-mid)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <ForestIcon /> Forest View
            </span>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'var(--accent)', fill: 'none', strokeWidth: 2.5 }}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        ) : (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--ink-muted)',
              fontSize: '1rem',
              cursor: 'not-allowed',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ForestIcon faded /> Forest View
              </span>
              <span style={{ fontSize: '0.85rem' }}>{linkCount} / {FOREST_THRESHOLD}</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
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

function ForestIcon({ faded }: { faded?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{
        width: 16,
        height: 16,
        stroke: 'currentColor',
        fill: 'none',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        opacity: faded ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="14" r="2.5" />
      <circle cx="6" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <line x1="7.4" y1="7.4" x2="10.6" y2="12.6" />
      <line x1="16.6" y1="7.4" x2="13.4" y2="12.6" />
      <line x1="11" y1="15.5" x2="7" y2="19" />
      <line x1="13" y1="15.5" x2="17" y2="19" />
    </svg>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.7rem',
  width: '100%',
  padding: '0.85rem 1rem',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.95rem',
  color: 'var(--ink)',
  textAlign: 'left',
}
