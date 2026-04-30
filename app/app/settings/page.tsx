'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useWorkspace,
  ACCENT_PALETTES,
  AccentColor,
  WorkspaceType,
} from '@/lib/WorkspaceContext'
import { useToast } from '@/components/app/Toast'

const WORKSPACE_OPTIONS: {
  type: WorkspaceType
  title: string
  desc: string
  icon: string
}[] = [
  { type: 'student', title: 'Student', desc: 'Courses, lecture notes, exams', icon: '✦' },
  { type: 'researcher', title: 'Researcher', desc: 'Projects, papers, lab notes', icon: '◇' },
  { type: 'professional', title: 'Professional', desc: 'Clients, meetings, deliverables', icon: '◈' },
]

const COLOR_ORDER: AccentColor[] = ['forest', 'ocean', 'amber', 'rose', 'violet', 'mono']

export default function SettingsPage() {
  const {
    workspaceType,
    setWorkspaceType,
    accentColor,
    setAccentColor,
    userName,
    setUserName,
  } = useWorkspace()
  const { showToast } = useToast()
  const [nameDraft, setNameDraft] = useState(userName ?? '')
  const [savedAt, setSavedAt] = useState<number | null>(null)

  function handleSaveName() {
    setUserName(nameDraft.trim())
    setSavedAt(Date.now())
    showToast(
      nameDraft.trim() ? `Saved — we'll greet you as ${nameDraft.trim()}.` : 'Name cleared.',
      { variant: 'success' },
    )
  }

  function handleResetOnboarding() {
    try {
      localStorage.removeItem('notework_workspace_type')
      localStorage.removeItem('notework_user_name')
      localStorage.removeItem('notework_accent_color')
    } catch {}
    showToast('Onboarding reset — refresh to see it again.', { variant: 'info' })
  }

  function handleClearNotes() {
    if (
      !window.confirm(
        'This permanently deletes every note and link in this browser. Continue?',
      )
    )
      return
    try {
      localStorage.removeItem('notework_notes')
      localStorage.removeItem('notework-links')
      localStorage.removeItem('notework_partition_cache_v1')
      localStorage.removeItem('notework_recommendations_cache_v1')
      localStorage.removeItem('notework_cluster_colors_v2')
    } catch {}
    showToast('All notes deleted. Reloading…', { variant: 'warn' })
    setTimeout(() => window.location.reload(), 800)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        color: 'var(--ink)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '1rem 1.75rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/app"
          style={{
            color: 'var(--ink-muted)',
            fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          ← Back to notes
        </Link>
        <span
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: '1.5rem',
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          Note
          <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>work</span>{' '}
          <span style={{ color: 'var(--ink-faint)', fontSize: '1.05rem' }}>
            · Settings
          </span>
        </span>
        <span style={{ width: 100 }} />
      </div>

      <div
        style={{
          padding: '3rem 2.5rem 5rem',
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 'clamp(2.4rem, 4.5vw, 3.2rem)',
            fontWeight: 400,
            color: 'var(--ink)',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            marginBottom: '0.75rem',
          }}
        >
          Settings
        </h1>
        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--ink-muted)',
            marginBottom: '2.75rem',
            lineHeight: 1.55,
            maxWidth: 560,
          }}
        >
          Tune Notework to fit how you work. Everything lives in your browser.
        </p>

        {/* Name */}
        <Section title="Your name" desc="We greet you by name on the welcome screen.">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Your first name"
              maxLength={40}
              style={{
                flex: '1 1 220px',
                padding: '0.85rem 1.1rem',
                fontSize: '1.1rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                borderRadius: 12,
                color: 'var(--ink)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                ;(e.currentTarget as HTMLInputElement).style.borderColor = 'var(--accent)'
              }}
              onBlur={(e) => {
                ;(e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border-strong)'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName()
              }}
            />
            <button
              onClick={handleSaveName}
              disabled={nameDraft.trim() === userName}
              style={{
                background: nameDraft.trim() === userName ? 'var(--bg-elevated-2)' : 'var(--accent)',
                color: nameDraft.trim() === userName ? 'var(--ink-muted)' : '#0E0E0C',
                border: 'none',
                borderRadius: 99,
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: nameDraft.trim() === userName ? 'default' : 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              {savedAt ? 'Saved' : 'Save'}
            </button>
          </div>
        </Section>

        {/* Workspace type */}
        <Section
          title="Workspace mode"
          desc="Shapes the language and prompts throughout the app."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {WORKSPACE_OPTIONS.map((opt) => {
              const active = workspaceType === opt.type
              return (
                <button
                  key={opt.type}
                  onClick={() => {
                    setWorkspaceType(opt.type)
                    showToast(`Mode set to ${opt.title}.`, { variant: 'success' })
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '1.15rem 1.2rem',
                    background: active ? 'var(--accent-light)' : 'var(--bg-elevated)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                    borderRadius: 14,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    color: 'inherit',
                    fontFamily: 'inherit',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--accent)',
                      fontSize: '1.4rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    {opt.icon}
                  </div>
                  <div
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    {opt.title}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
                    {opt.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Accent */}
        <Section
          title="Accent color"
          desc="Sets the highlight color throughout the app and the Forest View."
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
            {COLOR_ORDER.map((c) => {
              const palette = ACCENT_PALETTES[c]
              const active = accentColor === c
              return (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  title={palette.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.85rem 0.75rem',
                    width: 100,
                    background: active ? 'var(--bg-elevated-2)' : 'var(--bg-elevated)',
                    border: `1px solid ${active ? palette.accent : 'var(--border-strong)'}`,
                    borderRadius: 14,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    color: 'inherit',
                    fontFamily: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: palette.accent,
                      boxShadow: active ? `0 0 0 4px ${palette.glow}` : 'none',
                      transition: 'box-shadow 0.18s',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.92rem',
                      color: active ? 'var(--ink)' : 'var(--ink-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {palette.name}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Danger zone */}
        <Section
          title="Reset"
          desc="Local-only data. Nothing leaves your browser unless you choose to share."
          accent="warn"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <DangerRow
              label="Re-do the welcome flow"
              hint="Re-runs onboarding next time you load the app."
              cta="Reset onboarding"
              onClick={handleResetOnboarding}
            />
            <DangerRow
              label="Delete all notes & links"
              hint="Permanently removes every note in this browser. Cannot be undone."
              cta="Wipe all data"
              destructive
              onClick={handleClearNotes}
            />
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  desc,
  children,
  accent,
}: {
  title: string
  desc: string
  children: React.ReactNode
  accent?: 'warn'
}) {
  return (
    <section
      style={{
        marginBottom: '2.25rem',
        padding: '1.5rem 1.75rem',
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-strong)',
        borderRight: '1px solid var(--border-strong)',
        borderBottom: '1px solid var(--border-strong)',
        borderLeft: `4px solid ${accent === 'warn' ? '#E0B05A' : 'var(--accent)'}`,
        borderRadius: 16,
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontSize: '1.5rem',
          color: 'var(--ink)',
          margin: '0 0 0.4rem',
          fontWeight: 400,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: '0.98rem',
          color: 'var(--ink-muted)',
          margin: '0 0 1.25rem',
          lineHeight: 1.55,
        }}
      >
        {desc}
      </p>
      {children}
    </section>
  )
}

function DangerRow({
  label,
  hint,
  cta,
  onClick,
  destructive,
}: {
  label: string
  hint: string
  cta: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.85rem 1rem',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
        <div style={{ fontSize: '1rem', color: 'var(--ink)', fontWeight: 500, marginBottom: '0.2rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
          {hint}
        </div>
      </div>
      <button
        onClick={onClick}
        style={{
          background: destructive ? 'rgba(239,68,68,0.12)' : 'transparent',
          color: destructive ? '#ef4444' : 'var(--ink)',
          border: `1px solid ${destructive ? 'rgba(239,68,68,0.4)' : 'var(--border-strong)'}`,
          borderRadius: 8,
          padding: '0.55rem 1rem',
          fontSize: '0.92rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {cta}
      </button>
    </div>
  )
}
