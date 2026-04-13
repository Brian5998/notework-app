'use client'

import { useState } from 'react'

type Props = {
  onSearch: (query: string) => void
  onClear: () => void
  isSearching: boolean
}

export default function SearchBar({ onSearch, onClear, isSearching }: Props) {
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  function handleClear() {
    setQuery('')
    onClear()
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '0.75rem 1rem',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'var(--ink-faint)', fill: 'none', strokeWidth: 2, flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes..."
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: '0.82rem',
          color: 'var(--ink)',
          minWidth: 0,
        }}
      />
      {isSearching && (
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>…</span>
      )}
      {query && !isSearching && (
        <button
          type="button"
          onClick={handleClear}
          style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      )}
    </form>
  )
}
