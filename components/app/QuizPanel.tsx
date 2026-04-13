'use client'

import { useState, useCallback } from 'react'
import { Note } from '@/lib/types'

type QuizQuestion = {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  sourceNote: string
}

type Props = {
  notes: Note[]
  onClose: () => void
}

export default function QuizPanel({ notes, onClose }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [quizStarted, setQuizStarted] = useState(false)
  const [questionCount, setQuestionCount] = useState(5)

  const generateQuiz = useCallback(async () => {
    setIsLoading(true)
    setQuizStarted(true)
    setAnswers({})
    setRevealed(new Set())
    setCurrentIndex(0)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, count: questionCount }),
      })
      const data = await res.json()
      setQuestions(data.questions ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [notes, questionCount])

  const currentQ = questions[currentIndex]
  const totalAnswered = Object.keys(answers).length
  const totalCorrect = questions.filter(
    (q) => answers[q.id] && answers[q.id] === q.correctAnswer
  ).length
  const quizComplete = totalAnswered === questions.length && questions.length > 0

  function selectAnswer(questionId: string, answer: string) {
    if (revealed.has(questionId)) return
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
    setRevealed((prev) => new Set(prev).add(questionId))
  }

  function handleShortAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  function revealShortAnswer(questionId: string) {
    setRevealed((prev) => new Set(prev).add(questionId))
  }

  // Pre-quiz setup screen
  if (!quizStarted) {
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
            maxWidth: 480,
            padding: '2.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontSize: '1.5rem',
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
              }}
            >
              Quiz Mode
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1.2rem' }}>
              ×
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Generate quiz questions from your own notes. Test your understanding, not just memorization.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Number of questions
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[3, 5, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: 8,
                    border: '0.5px solid',
                    borderColor: questionCount === n ? 'var(--accent)' : 'var(--border)',
                    background: questionCount === n ? 'var(--accent-light)' : 'transparent',
                    color: questionCount === n ? 'var(--accent)' : 'var(--ink-muted)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>
            Generating from {notes.length} note{notes.length !== 1 ? 's' : ''}
          </div>

          <button
            onClick={generateQuiz}
            disabled={notes.length === 0}
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 100,
              padding: '0.75rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: notes.length > 0 ? 'pointer' : 'not-allowed',
              opacity: notes.length > 0 ? 1 : 0.5,
              transition: 'opacity 0.15s',
            }}
          >
            Start Quiz
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
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
      >
        <div style={{
          background: 'var(--bg)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem',
          textAlign: 'center',
        }}>
          <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: 'var(--accent)', fill: 'none', strokeWidth: 2, animation: 'spin 1s linear infinite', marginBottom: '1rem' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>Generating your quiz...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
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
        <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
            Could not generate questions. Try adding more detailed notes.
          </p>
          <button onClick={onClose} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 100, padding: '0.5rem 1.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    )
  }

  // Results screen
  if (quizComplete) {
    const pct = Math.round((totalCorrect / questions.length) * 100)
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
            maxWidth: 480,
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: pct >= 70 ? 'var(--accent-light)' : 'rgba(245,158,11,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <span style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: '1.5rem',
              color: pct >= 70 ? 'var(--accent)' : '#D97706',
            }}>
              {pct}%
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: '1.4rem',
              color: 'var(--ink)',
              marginBottom: '0.5rem',
            }}
          >
            {pct >= 90 ? 'Excellent!' : pct >= 70 ? 'Good work!' : pct >= 50 ? 'Getting there!' : 'Keep studying!'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', marginBottom: '2rem' }}>
            {totalCorrect} of {questions.length} correct
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setQuizStarted(false)
                setQuestions([])
              }}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 100,
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              New Quiz
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                color: 'var(--ink-muted)',
                border: '0.5px solid var(--border)',
                borderRadius: 100,
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active quiz
  const isRevealed = revealed.has(currentQ.id)
  const userAnswer = answers[currentQ.id] ?? ''
  const isCorrect = userAnswer === currentQ.correctAnswer

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
    >
      <div
        style={{
          background: 'var(--bg)',
          borderRadius: 'var(--radius-lg)',
          border: '0.5px solid var(--border)',
          width: '90%',
          maxWidth: 560,
          padding: '2rem',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              background: 'var(--accent-light)',
              padding: '0.25rem 0.6rem',
              borderRadius: 100,
            }}>
              {currentIndex + 1} / {questions.length}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', textTransform: 'capitalize' }}>
              {currentQ.type.replace('_', ' ')}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1.1rem' }}>
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'var(--accent)',
            borderRadius: 2,
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Question */}
        <h3 style={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontSize: '1.15rem',
          color: 'var(--ink)',
          lineHeight: 1.5,
          marginBottom: '1.5rem',
          letterSpacing: '-0.01em',
        }}>
          {currentQ.question}
        </h3>

        {/* Options */}
        {currentQ.type === 'multiple_choice' && currentQ.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {currentQ.options.map((opt) => {
              const isSelected = userAnswer === opt
              const isCorrectOpt = opt === currentQ.correctAnswer
              let bg = 'var(--bg-card)'
              let borderColor = 'var(--border)'
              let color = 'var(--ink)'
              if (isRevealed) {
                if (isCorrectOpt) { bg = 'var(--accent-light)'; borderColor = 'var(--accent)'; color = 'var(--accent)' }
                else if (isSelected && !isCorrectOpt) { bg = 'rgba(226,75,74,0.08)'; borderColor = 'var(--conflict)'; color = 'var(--conflict)' }
              } else if (isSelected) {
                bg = 'var(--accent-light)'; borderColor = 'var(--accent)'
              }
              return (
                <button
                  key={opt}
                  onClick={() => selectAnswer(currentQ.id, opt)}
                  disabled={isRevealed}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    border: `0.5px solid ${borderColor}`,
                    background: bg,
                    color,
                    fontSize: '0.88rem',
                    cursor: isRevealed ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                    lineHeight: 1.5,
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {currentQ.type === 'true_false' && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            {['True', 'False'].map((opt) => {
              const isSelected = userAnswer === opt
              const isCorrectOpt = opt === currentQ.correctAnswer
              let bg = 'var(--bg-card)'
              let borderColor = 'var(--border)'
              let color = 'var(--ink)'
              if (isRevealed) {
                if (isCorrectOpt) { bg = 'var(--accent-light)'; borderColor = 'var(--accent)'; color = 'var(--accent)' }
                else if (isSelected && !isCorrectOpt) { bg = 'rgba(226,75,74,0.08)'; borderColor = 'var(--conflict)'; color = 'var(--conflict)' }
              } else if (isSelected) {
                bg = 'var(--accent-light)'; borderColor = 'var(--accent)'
              }
              return (
                <button
                  key={opt}
                  onClick={() => selectAnswer(currentQ.id, opt)}
                  disabled={isRevealed}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: `0.5px solid ${borderColor}`,
                    background: bg,
                    color,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: isRevealed ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {currentQ.type === 'short_answer' && (
          <div style={{ marginBottom: '1rem' }}>
            <textarea
              value={userAnswer}
              onChange={(e) => handleShortAnswer(currentQ.id, e.target.value)}
              disabled={isRevealed}
              placeholder="Type your answer..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.75rem',
                borderRadius: 8,
                border: '0.5px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--ink)',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                minHeight: 80,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            {!isRevealed && (
              <button
                onClick={() => revealShortAnswer(currentQ.id)}
                disabled={!userAnswer.trim()}
                style={{
                  marginTop: '0.5rem',
                  background: userAnswer.trim() ? 'var(--accent)' : 'var(--bg-card)',
                  color: userAnswer.trim() ? '#fff' : 'var(--ink-faint)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.4rem 1rem',
                  fontSize: '0.8rem',
                  cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Check Answer
              </button>
            )}
          </div>
        )}

        {/* Explanation */}
        {isRevealed && (
          <div style={{
            padding: '0.85rem 1rem',
            borderRadius: 8,
            background: isCorrect || currentQ.type === 'short_answer' ? 'var(--accent-light)' : 'rgba(226,75,74,0.06)',
            borderLeft: `3px solid ${isCorrect || currentQ.type === 'short_answer' ? 'var(--accent)' : 'var(--conflict)'}`,
            marginBottom: '1rem',
          }}>
            {currentQ.type !== 'short_answer' && (
              <div style={{ fontSize: '0.78rem', fontWeight: 500, color: isCorrect ? 'var(--accent)' : 'var(--conflict)', marginBottom: '0.35rem' }}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
            )}
            {currentQ.type === 'short_answer' && (
              <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--accent)', marginBottom: '0.35rem' }}>
                Expected answer: {currentQ.correctAnswer}
              </div>
            )}
            <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
              {currentQ.explanation}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.4rem' }}>
              Source: {currentQ.sourceNote}
            </div>
          </div>
        )}

        {/* Navigation */}
        {isRevealed && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))}
              style={{
                background: 'var(--ink)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 100,
                padding: '0.55rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
