'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Note } from '@/lib/types'

const RECENT_SEARCHES_KEY = 'notework_recent_searches'
const VOCAB_KEY = 'notework_vocab_mappings'
const MAX_RECENT = 5

type SearchResult = { id: string; reason: string; excerpt?: string }
type Neighbor = { id: string; reason: string }
type VocabMapping = { query: string; noteId: string }

type Props = {
  notes: Note[]
  onSelect: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter((q) => q !== query)
  recent.unshift(query)
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT)),
  )
}

function getVocabMappings(): VocabMapping[] {
  try {
    return JSON.parse(localStorage.getItem(VOCAB_KEY) || '[]')
  } catch {
    return []
  }
}

function saveVocabMapping(query: string, noteId: string) {
  const mappings = getVocabMappings().filter(
    (m) => !(m.query === query && m.noteId === noteId),
  )
  mappings.push({ query, noteId })
  if (mappings.length > 50) mappings.shift()
  localStorage.setItem(VOCAB_KEY, JSON.stringify(mappings))
}

export default function CommandPalette({
  notes,
  onSelect,
  isOpen,
  onClose,
}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [neighbors, setNeighbors] = useState<Neighbor[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchQueryRef = useRef('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches())
      setQuery('')
      setResults([])
      setNeighbors([])
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const performSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setNeighbors([])
        return
      }

      searchQueryRef.current = q
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsSearching(true)
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            notes,
            vocabMappings: getVocabMappings(),
          }),
          signal: controller.signal,
        })
        const data = await res.json()
        if (searchQueryRef.current === q) {
          setResults(data.results ?? [])
          setNeighbors(data.neighbors ?? [])
          setActiveIndex(0)
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setResults([])
          setNeighbors([])
        }
      } finally {
        if (searchQueryRef.current === q) setIsSearching(false)
      }
    },
    [notes],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      saveRecentSearch(query.trim())
      performSearch(query.trim())
    }
  }

  function handleSelectResult(id: string) {
    if (query.trim()) {
      saveVocabMapping(query.trim(), id)
      saveRecentSearch(query.trim())
    }
    onSelect(id)
    onClose()
  }

  function handleRecentClick(q: string) {
    setQuery(q)
    performSearch(q)
  }

  const allItems = [
    ...results.map((r) => ({ ...r, section: 'result' as const })),
    ...neighbors.map((n) => ({ ...n, section: 'neighbor' as const })),
  ]

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (allItems.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && !(e.nativeEvent as KeyboardEvent).isComposing && allItems.length > 0) {
      if (results.length > 0 || neighbors.length > 0) {
        e.preventDefault()
        handleSelectResult(allItems[activeIndex].id)
      }
    }
  }

  const noteMap = Object.fromEntries(notes.map((n) => [n.id, n]))

  if (!isOpen) return null

  const hasResults = results.length > 0 || neighbors.length > 0
  const showRecent =
    !query.trim() && !isSearching && recentSearches.length > 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'var(--bg-elevated)',
          borderRadius: 18,
          border: '1px solid var(--border-strong)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          animation: 'cmdPaletteIn 0.18s ease-out',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{
                width: 22,
                height: 22,
                stroke: 'var(--accent)',
                fill: 'none',
                strokeWidth: 2,
                flexShrink: 0,
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search your notes..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '1.3rem',
                color: 'var(--ink)',
                fontWeight: 400,
              }}
            />
            {isSearching && (
              <div style={{ display: 'flex', gap: '3px' }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      opacity: 0.6,
                      animation: `cmdPulseDot 0.8s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
            <kbd
              style={{
                fontSize: '0.78rem',
                color: 'var(--ink-faint)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 5,
                padding: '0.18rem 0.45rem',
                fontFamily: 'inherit',
              }}
            >
              ESC
            </kbd>
          </div>
        </form>

        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {/* Recent searches */}
          {showRecent && (
            <div style={{ padding: '0.5rem 0' }}>
              <div
                style={{
                  padding: '0.4rem 1.25rem',
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                }}
              >
                Recent
              </div>
              {recentSearches.map((q) => (
                <button
                  key={q}
                  onClick={() => handleRecentClick(q)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    padding: '0.5rem 1.25rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    color: 'var(--ink-muted)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'var(--accent-light)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'transparent')
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    style={{
                      width: 13,
                      height: 13,
                      stroke: 'var(--ink-faint)',
                      fill: 'none',
                      strokeWidth: 2,
                      flexShrink: 0,
                    }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Skeleton loaders */}
          {isSearching && results.length === 0 && (
            <div style={{ padding: '0.5rem 0' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ padding: '0.75rem 1.25rem' }}
                >
                  <div
                    style={{
                      height: 14,
                      width: `${55 + i * 12}%`,
                      background: 'var(--border)',
                      borderRadius: 4,
                      marginBottom: 8,
                      animation: 'skeletonPulse 1.5s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      width: `${75 - i * 8}%`,
                      background: 'var(--border)',
                      borderRadius: 4,
                      animation: 'skeletonPulse 1.5s ease-in-out 0.1s infinite',
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Main results */}
          {hasResults && (
            <>
              {results.length > 0 && (
                <div style={{ padding: '0.5rem 0' }}>
                  <div
                    style={{
                      padding: '0.55rem 1.5rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    {results.length} result
                    {results.length !== 1 ? 's' : ''}
                  </div>
                  {results.map((r, idx) => {
                    const note = noteMap[r.id]
                    if (!note) return null
                    const isActive = idx === activeIndex
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleSelectResult(r.id)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.85rem 1.5rem',
                          background: isActive
                            ? 'var(--accent-light)'
                            : 'transparent',
                          border: 'none',
                          borderLeft: isActive
                            ? '3px solid var(--accent)'
                            : '3px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <div
                          style={{
                            fontSize: '1.08rem',
                            fontWeight: 500,
                            color: 'var(--ink)',
                            marginBottom: '0.3rem',
                          }}
                        >
                          {note.title || 'Untitled'}
                        </div>
                        {r.excerpt && (
                          <div
                            style={{
                              fontSize: '0.92rem',
                              color: 'var(--ink-muted)',
                              lineHeight: 1.55,
                              marginBottom: '0.25rem',
                              fontStyle: 'italic',
                              borderLeft: '2px solid var(--accent)',
                              paddingLeft: '0.65rem',
                            }}
                          >
                            &ldquo;{r.excerpt}&rdquo;
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--ink-faint)',
                            lineHeight: 1.45,
                          }}
                        >
                          {r.reason}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Neighboring results */}
              {neighbors.length > 0 && (
                <div
                  style={{
                    padding: '0.5rem 0',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      padding: '0.55rem 1.5rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    You might also find relevant
                  </div>
                  {neighbors.map((n, idx) => {
                    const note = noteMap[n.id]
                    if (!note) return null
                    const globalIdx = results.length + idx
                    const isActive = globalIdx === activeIndex
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleSelectResult(n.id)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.75rem 1.5rem',
                          background: isActive
                            ? 'var(--accent-light)'
                            : 'transparent',
                          border: 'none',
                          borderLeft: isActive
                            ? '3px solid var(--accent-mid)'
                            : '3px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.1s',
                          opacity: 0.85,
                        }}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                      >
                        <div
                          style={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'var(--ink)',
                            marginBottom: '0.25rem',
                          }}
                        >
                          {note.title || 'Untitled'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--ink-faint)',
                            lineHeight: 1.45,
                          }}
                        >
                          {n.reason}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* No results state */}
          {!isSearching && query.trim() && !hasResults && (
            <div
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                color: 'var(--ink-faint)',
                fontSize: '1rem',
              }}
            >
              No matching notes found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.7rem 1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            fontSize: '0.78rem',
            color: 'var(--ink-faint)',
          }}
        >
          <span>
            <kbd style={kbdStyle}>↑↓</kbd> navigate
          </span>
          <span>
            <kbd style={kbdStyle}>↵</kbd> open
          </span>
          <span>
            <kbd style={kbdStyle}>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '0.1rem 0.4rem',
  fontSize: '0.72rem',
  fontFamily: 'inherit',
  marginRight: '0.3rem',
}
