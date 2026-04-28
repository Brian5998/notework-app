'use client'

import { useState } from 'react'
import { WorkspaceType, AccentColor, useWorkspace, ACCENT_PALETTES } from '@/lib/WorkspaceContext'

const WORKSPACE_OPTIONS: {
  type: WorkspaceType
  title: string
  desc: string
  icon: string
}[] = [
  {
    type: 'student',
    title: 'Student',
    desc: 'Courses, lecture notes, exams, study groups',
    icon: '✦',
  },
  {
    type: 'researcher',
    title: 'Researcher',
    desc: 'Projects, papers, literature threads, lab notes',
    icon: '◇',
  },
  {
    type: 'professional',
    title: 'Professional',
    desc: 'Clients, engagements, meetings, deliverables',
    icon: '◈',
  },
]

const COLOR_ORDER: AccentColor[] = ['forest', 'ocean', 'amber', 'rose', 'violet', 'mono']

type Step = 'workspace' | 'color' | 'name'

export default function OnboardingScreen() {
  const {
    setWorkspaceType,
    accentColor,
    setAccentColor,
    userName,
    setUserName,
  } = useWorkspace()
  const [step, setStep] = useState<Step>('workspace')
  const [pendingType, setPendingType] = useState<WorkspaceType | null>(null)
  const [hovered, setHovered] = useState<WorkspaceType | null>(null)
  const [nameInput, setNameInput] = useState(userName ?? '')

  function handleWorkspacePick(type: WorkspaceType) {
    setPendingType(type)
    setStep('color')
  }

  function handleColorContinue() {
    setStep('name')
  }

  function handleFinish() {
    const trimmed = nameInput.trim()
    if (trimmed) setUserName(trimmed)
    if (pendingType) setWorkspaceType(pendingType)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        animation: 'fadeIn 0.3s ease',
        padding: '2rem 0',
      }}
    >
      {step === 'workspace' && (
        <div style={{ textAlign: 'center', maxWidth: 820, padding: '0 1.5rem', width: '100%' }}>
          <StepIndicator current={1} />
          <h1 style={titleStyle}>
            Welcome to Note
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>work</span>
          </h1>
          <p style={subtitleStyle}>
            How will you use Notework? This shapes the language and prompts throughout.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
            }}
          >
            {WORKSPACE_OPTIONS.map((opt) => {
              const isHovered = hovered === opt.type
              return (
                <button
                  key={opt.type}
                  onClick={() => handleWorkspacePick(opt.type)}
                  onMouseEnter={() => setHovered(opt.type)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.1rem',
                    padding: '2.75rem 1.6rem',
                    background: isHovered ? 'var(--bg-elevated-2)' : 'var(--bg-elevated)',
                    border: `1px solid ${isHovered ? 'var(--accent-mid)' : 'var(--border)'}`,
                    borderRadius: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: isHovered ? 'translateY(-3px)' : 'none',
                    boxShadow: isHovered
                      ? '0 14px 36px rgba(0,0,0,0.4)'
                      : '0 2px 8px rgba(0,0,0,0.15)',
                    color: 'var(--ink)',
                  }}
                >
                  <span style={{ fontSize: '2.8rem', color: 'var(--accent)', lineHeight: 1 }}>{opt.icon}</span>
                  <span
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: 500,
                      color: 'var(--ink)',
                    }}
                  >
                    {opt.title}
                  </span>
                  <span
                    style={{
                      fontSize: '1.05rem',
                      color: 'var(--ink-muted)',
                      lineHeight: 1.55,
                    }}
                  >
                    {opt.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === 'color' && (
        <div style={{ textAlign: 'center', maxWidth: 820, padding: '0 1.5rem', width: '100%' }}>
          <StepIndicator current={2} />
          <h1 style={titleStyle}>
            Pick your <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>accent</span>
          </h1>
          <p style={subtitleStyle}>
            Set the mood. You can change this any time in settings.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '1rem',
              marginBottom: '3rem',
            }}
          >
            {COLOR_ORDER.map((c) => {
              const palette = ACCENT_PALETTES[c]
              const isActive = accentColor === c
              return (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1.25rem 0.5rem',
                    background: isActive ? 'var(--bg-elevated-2)' : 'var(--bg-elevated)',
                    border: `1px solid ${isActive ? palette.accent : 'var(--border)'}`,
                    borderRadius: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'var(--ink)',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: palette.accent,
                      boxShadow: isActive ? `0 0 0 5px ${palette.glow}` : 'none',
                      transition: 'box-shadow 0.2s',
                    }}
                  />
                  <span style={{ fontSize: '0.92rem', color: 'var(--ink-muted)', fontWeight: 500 }}>
                    {palette.name}
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem' }}>
            <button onClick={() => setStep('workspace')} style={ghostButtonStyle}>
              ← Back
            </button>
            <button onClick={handleColorContinue} style={primaryButtonStyle}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 'name' && (
        <div style={{ textAlign: 'center', maxWidth: 640, padding: '0 1.5rem', width: '100%' }}>
          <StepIndicator current={3} />
          <h1 style={titleStyle}>
            What should we <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>call you</span>?
          </h1>
          <p style={subtitleStyle}>
            We'll greet you by name when you open Notework.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              marginBottom: '2.5rem',
            }}
          >
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameInput.trim()) handleFinish()
              }}
              placeholder="Your first name"
              maxLength={40}
              style={{
                width: '100%',
                maxWidth: 460,
                padding: '1.1rem 1.5rem',
                fontSize: '1.4rem',
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                borderRadius: 16,
                color: 'var(--ink)',
                outline: 'none',
                textAlign: 'center',
                letterSpacing: '-0.01em',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={(e) => {
                ;(e.currentTarget as HTMLInputElement).style.borderColor = 'var(--accent)'
                ;(e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 4px var(--accent-light)'
              }}
              onBlur={(e) => {
                ;(e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border-strong)'
                ;(e.currentTarget as HTMLInputElement).style.boxShadow = 'none'
              }}
            />
            <p style={{ fontSize: '0.95rem', color: 'var(--ink-faint)' }}>
              You can change this later in settings.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem' }}>
            <button onClick={() => setStep('color')} style={ghostButtonStyle}>
              ← Back
            </button>
            <button
              onClick={handleFinish}
              disabled={!nameInput.trim()}
              style={{
                ...primaryButtonStyle,
                opacity: nameInput.trim() ? 1 : 0.4,
                cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Enter Notework →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div
      style={{
        fontSize: '0.85rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'var(--ink-faint)',
        marginBottom: '1.5rem',
        fontWeight: 500,
      }}
    >
      Step {current} of 3
    </div>
  )
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
  fontSize: '3.6rem',
  fontWeight: 400,
  color: 'var(--ink)',
  marginBottom: '1rem',
  letterSpacing: '-0.025em',
  lineHeight: 1.05,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  color: 'var(--ink-muted)',
  marginBottom: '3rem',
  lineHeight: 1.55,
  maxWidth: 560,
  margin: '0 auto 3rem',
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '1rem 2.5rem',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 99,
  color: '#0E0E0C',
  fontSize: '1.05rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 0 28px var(--accent-glow)',
  letterSpacing: '0.02em',
  transition: 'transform 0.12s, box-shadow 0.18s',
}

const ghostButtonStyle: React.CSSProperties = {
  padding: '1rem 1.75rem',
  background: 'transparent',
  border: '1px solid var(--border-strong)',
  borderRadius: 99,
  color: 'var(--ink-muted)',
  fontSize: '1.05rem',
  fontWeight: 500,
  cursor: 'pointer',
  letterSpacing: '0.02em',
}
