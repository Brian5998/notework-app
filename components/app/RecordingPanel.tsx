'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

type Props = {
  onSave: (title: string, content: string) => void
  onClose: () => void
}

export default function RecordingPanel({ onSave, onClose }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    setInterimText('')
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!supported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    setError(null)
    setIsRecording(true)
    setSeconds(0)
    setInterimText('')

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interim = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }

      if (finalText) {
        setTranscript((prev) => {
          const combined = prev + finalText
          return combined.trim()
        })
      }
      setInterimText(interim)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return
      if (event.error === 'aborted') return
      setError(`Recognition error: ${event.error}`)
      stopRecording()
    }

    recognition.onend = () => {
      if (recognitionRef.current === recognition && isRecording) {
        try { recognition.start() } catch {}
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setError('Could not start recording. Please check microphone permissions.')
      setIsRecording(false)
      return
    }

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
  }, [supported, stopRecording, isRecording])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function handleSave() {
    const finalContent = transcript.trim()
    if (!finalContent) return
    const noteTitle = title.trim() || `Voice note — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
    onSave(noteTitle, finalContent)
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const fullText = transcript + (interimText ? (transcript ? ' ' : '') + interimText : '')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: 'var(--radius-lg)',
          border: '0.5px solid var(--border)',
          width: '90%',
          maxWidth: 540,
          padding: '2rem',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: '1.3rem',
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}
          >
            Voice Recording
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1.2rem' }}>
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '0.6rem 0.85rem',
            marginBottom: '1rem',
            borderLeft: '3px solid var(--conflict)',
            background: 'rgba(226,75,74,0.06)',
            borderRadius: '0 6px 6px 0',
            fontSize: '0.8rem',
            color: 'var(--conflict)',
          }}>
            {error}
          </div>
        )}

        {/* Title input */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title (optional)"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.6rem 0.75rem',
            borderRadius: 8,
            border: '0.5px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--ink)',
            fontSize: '0.88rem',
            outline: 'none',
            marginBottom: '1rem',
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          }}
        />

        {/* Recording controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.25rem' }}>
          {!isRecording ? (
            <button
              onClick={startRecording}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: 'none',
                background: 'var(--accent)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 2px 12px rgba(45,90,61,0.3)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = '' }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: '#fff', stroke: 'none' }}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="19" x2="12" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="23" x2="16" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <>
              {/* Timer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--conflict)',
                  animation: 'pulse-dot 1.5s ease-in-out infinite',
                }} />
                <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
                <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--ink)', fontWeight: 500, minWidth: 48 }}>
                  {formatTime(seconds)}
                </span>
              </div>

              {/* Stop button */}
              <button
                onClick={stopRecording}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--conflict)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s',
                  boxShadow: '0 2px 12px rgba(226,75,74,0.3)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = '' }}
              >
                <div style={{ width: 18, height: 18, borderRadius: 3, background: '#fff' }} />
              </button>
            </>
          )}
        </div>

        {/* Status text */}
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
          {isRecording ? 'Listening... speak clearly' : fullText ? 'Recording stopped. Review your transcript below.' : 'Tap the microphone to start recording'}
        </div>

        {/* Transcript area */}
        <div
          style={{
            flex: 1,
            minHeight: 120,
            maxHeight: 260,
            overflowY: 'auto',
            padding: '0.85rem',
            borderRadius: 8,
            border: '0.5px solid var(--border)',
            background: 'var(--bg-card)',
            marginBottom: '1.25rem',
          }}
        >
          {fullText ? (
            <p style={{
              fontSize: '0.88rem',
              color: 'var(--ink)',
              lineHeight: 1.7,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {transcript}
              {interimText && (
                <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                  {transcript ? ' ' : ''}{interimText}
                </span>
              )}
            </p>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', margin: 0, textAlign: 'center', paddingTop: '2rem' }}>
              Your transcript will appear here as you speak...
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleSave}
            disabled={!transcript.trim()}
            style={{
              flex: 1,
              background: transcript.trim() ? 'var(--accent)' : 'var(--bg-card)',
              color: transcript.trim() ? '#fff' : 'var(--ink-faint)',
              border: 'none',
              borderRadius: 100,
              padding: '0.7rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: transcript.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            Save as Note
          </button>
          <button
            onClick={() => { setTranscript(''); setInterimText(''); setSeconds(0) }}
            disabled={!fullText}
            style={{
              padding: '0.7rem 1.25rem',
              background: 'transparent',
              color: fullText ? 'var(--ink-muted)' : 'var(--ink-faint)',
              border: '0.5px solid var(--border)',
              borderRadius: 100,
              fontSize: '0.85rem',
              cursor: fullText ? 'pointer' : 'not-allowed',
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
