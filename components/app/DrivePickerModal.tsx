'use client'

import { useEffect, useState } from 'react'

type DriveFile = { id: string; name: string; mimeType: string; modifiedTime: string }

type Props = {
  onClose: () => void
  onImport: (title: string, content: string) => void
}

export default function DrivePickerModal({ onClose, onImport }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/drive')
      .then((r) => r.json())
      .then((data) => {
        if (data.error === 'not_connected') {
          setError('not_connected')
        } else if (data.error) {
          setError('drive_error')
        } else {
          setFiles(data.files)
        }
      })
      .catch(() => setError('drive_error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleImport(file: DriveFile) {
    setImporting(file.id)
    try {
      const res = await fetch('/api/drive/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, fileName: file.name, mimeType: file.mimeType }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onImport(data.title, data.content)
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to import file. Please try again.')
    } finally {
      setImporting(null)
    }
  }

  const docIcon = (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: '#4A8C62', strokeWidth: 1.5, flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 101, background: 'var(--bg-card)', borderRadius: 14,
        border: '0.5px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)' }}>Import from Google Drive</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {loading && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.85rem' }}>Loading your Drive…</p>}

          {error === 'not_connected' && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--ink-faint)', fontSize: '0.85rem', marginBottom: '1rem' }}>Connect your Google account to import files.</p>
              <a href="/api/auth/google" style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.85rem', textDecoration: 'none' }}>
                Sign in with Google
              </a>
            </div>
          )}

          {error === 'drive_error' && (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--conflict)', fontSize: '0.85rem' }}>Could not reach Google Drive. Please try again.</p>
          )}

          {!loading && !error && files.length === 0 && (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.85rem' }}>No Google Docs or PDFs found in your Drive.</p>
          )}

          {files.map((file) => (
            <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1.25rem', borderBottom: '0.5px solid var(--border)' }}>
              {docIcon}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                  {file.mimeType === 'application/vnd.google-apps.document' ? 'Google Doc' : 'PDF'} · {new Date(file.modifiedTime).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleImport(file)}
                disabled={importing === file.id}
                style={{ flexShrink: 0, background: importing === file.id ? 'var(--ink-faint)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.78rem', cursor: importing === file.id ? 'default' : 'pointer' }}
              >
                {importing === file.id ? '…' : 'Import'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
