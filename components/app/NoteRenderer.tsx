'use client'

import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

type Props = { content: string }

// Render a single text segment (no math) as markdown HTML
function renderMarkdown(text: string): string {
  const lines = text.split('\n')
  let html = ''
  let inUl = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Headers
    if (/^### /.test(line)) {
      if (inUl) { html += '</ul>'; inUl = false }
      html += `<h3 style="font-size:0.95rem;font-weight:600;color:var(--ink);margin:1.2rem 0 0.3rem">${inlineMarkdown(line.slice(4))}</h3>`
      continue
    }
    if (/^## /.test(line)) {
      if (inUl) { html += '</ul>'; inUl = false }
      html += `<h2 style="font-size:1.05rem;font-weight:600;color:var(--ink);margin:1.5rem 0 0.4rem">${inlineMarkdown(line.slice(3))}</h2>`
      continue
    }
    if (/^# /.test(line)) {
      if (inUl) { html += '</ul>'; inUl = false }
      html += `<h1 style="font-size:1.15rem;font-weight:700;color:var(--ink);margin:1.75rem 0 0.5rem;padding-bottom:0.3rem;border-bottom:0.5px solid var(--border)">${inlineMarkdown(line.slice(2))}</h1>`
      continue
    }

    // Nested bullets (2+ spaces or tab before -)
    if (/^(  +|\t)- /.test(line)) {
      if (!inUl) { html += '<ul style="list-style:disc;padding-left:1.5rem;margin:0.25rem 0">'; inUl = true }
      const content = line.replace(/^(  +|\t)- /, '')
      html += `<li style="font-size:0.92rem;color:var(--ink);margin:0.25rem 0;padding-left:1rem;list-style:circle">${inlineMarkdown(content)}</li>`
      continue
    }

    // Bullets
    if (/^- /.test(line)) {
      if (!inUl) { html += '<ul style="list-style:disc;padding-left:1.25rem;margin:0.4rem 0">'; inUl = true }
      html += `<li style="font-size:0.92rem;color:var(--ink);margin:0.3rem 0">${inlineMarkdown(line.slice(2))}</li>`
      continue
    }

    // End list on non-bullet
    if (inUl && line.trim() !== '') { html += '</ul>'; inUl = false }

    // Blank line
    if (line.trim() === '') {
      html += '<div style="height:0.6rem"></div>'
      continue
    }

    // Paragraph
    html += `<p style="font-size:0.92rem;color:var(--ink);line-height:1.75;margin:0.2rem 0">${inlineMarkdown(line)}</p>`
  }

  if (inUl) html += '</ul>'
  return html
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:var(--accent-light);padding:0.1em 0.3em;border-radius:3px;font-size:0.88em">$1</code>')
}

// Split content into segments: { type: 'text'|'math'|'mathblock', value: string }
type Segment = { type: 'text' | 'math' | 'mathblock'; value: string }

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = []

  // First split on block math $$...$$
  const blockSplit = content.split(/(\$\$[\s\S]+?\$\$)/)

  for (const part of blockSplit) {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      segments.push({ type: 'mathblock', value: part.slice(2, -2).trim() })
    } else {
      // Split remaining on inline math $...$
      const inlineParts = part.split(/(\$[^$\n]+?\$)/)
      for (const ip of inlineParts) {
        if (ip.startsWith('$') && ip.endsWith('$') && ip.length > 2) {
          segments.push({ type: 'math', value: ip.slice(1, -1) })
        } else if (ip) {
          segments.push({ type: 'text', value: ip })
        }
      }
    }
  }

  return segments
}

export default function NoteRenderer({ content }: Props) {
  const segments = useMemo(() => parseSegments(content), [content])

  return (
    <div style={{ fontSize: '0.92rem', lineHeight: 1.75, color: 'var(--ink)' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'mathblock') {
          let mathHtml = ''
          try {
            mathHtml = katex.renderToString(seg.value, { displayMode: true, throwOnError: false })
          } catch {
            mathHtml = `<span style="color:var(--conflict)">${seg.value}</span>`
          }
          return (
            <div
              key={i}
              style={{ margin: '1rem 0', textAlign: 'center', overflowX: 'auto' }}
              dangerouslySetInnerHTML={{ __html: mathHtml }}
            />
          )
        }

        if (seg.type === 'math') {
          let mathHtml = ''
          try {
            mathHtml = katex.renderToString(seg.value, { displayMode: false, throwOnError: false })
          } catch {
            mathHtml = `<span style="color:var(--conflict)">${seg.value}</span>`
          }
          return <span key={i} dangerouslySetInnerHTML={{ __html: mathHtml }} />
        }

        // type === 'text' — render markdown
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(seg.value) }}
          />
        )
      })}
    </div>
  )
}
