'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'

type ToastVariant = 'success' | 'info' | 'warn'

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
  action?: { label: string; onClick: () => void }
}

type ToastContextValue = {
  showToast: (message: string, opts?: { variant?: ToastVariant; action?: { label: string; onClick: () => void } }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const showToast = useCallback<ToastContextValue['showToast']>((message, opts) => {
    const id = ++idRef.current
    const variant = opts?.variant ?? 'success'
    const item: ToastItem = { id, message, variant, action: opts?.action }
    setToasts((prev) => [...prev, item])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastBubble key={t.id} toast={t} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastBubble({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const accent =
    toast.variant === 'success'
      ? 'var(--accent)'
      : toast.variant === 'warn'
        ? '#E0B05A'
        : '#6FA5C9'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.15rem 0.85rem 1rem',
        background: 'var(--bg-elevated)',
        border: `1px solid ${accent}`,
        borderRadius: 14,
        color: 'var(--ink)',
        fontSize: '1rem',
        fontWeight: 500,
        minWidth: 260,
        maxWidth: 480,
        boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
        pointerEvents: 'auto',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.18s ease, transform 0.22s ease',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: `${accent}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {toast.variant === 'success' ? (
          <svg viewBox="0 0 24 24" width="13" height="13" stroke={accent} strokeWidth="3" fill="none">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : toast.variant === 'warn' ? (
          <svg viewBox="0 0 24 24" width="13" height="13" stroke={accent} strokeWidth="2.6" fill="none">
            <line x1="12" y1="8" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12" y2="17.01" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="13" height="13" stroke={accent} strokeWidth="2.6" fill="none">
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12" y2="16.01" />
          </svg>
        )}
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick()
            onDismiss()
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: accent,
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.2rem 0.4rem',
            letterSpacing: '0.02em',
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        aria-label="Dismiss"
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--ink-faint)',
          cursor: 'pointer',
          fontSize: '1.1rem',
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return { showToast: () => {} } as ToastContextValue
  }
  return ctx
}
