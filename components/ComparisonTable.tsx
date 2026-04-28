import FadeUp from './FadeUp'

const rows = [
  { feature: 'Semantic search', notework: '✓', goodnotes: '—', obsidian: 'Plugin only', evernote: 'Basic' },
  { feature: 'Contradiction detection', notework: '✓', goodnotes: '—', obsidian: '—', evernote: '—' },
  { feature: 'Suggested concept linking', notework: '✓', goodnotes: '—', obsidian: 'Manual only', evernote: '—' },
  { feature: 'Visual knowledge map', notework: '✓', goodnotes: '—', obsidian: '✓', evernote: '—' },
  { feature: 'Quiz from your notes', notework: '✓', goodnotes: '—', obsidian: '—', evernote: '—' },
  { feature: 'Knowledge evolution tracking', notework: '✓', goodnotes: '—', obsidian: '—', evernote: '—' },
  { feature: 'Concept heatmap', notework: '✓', goodnotes: '—', obsidian: '—', evernote: '—' },
  { feature: 'Timeline view', notework: '✓', goodnotes: '—', obsidian: '—', evernote: '—' },
  { feature: 'Handwriting to digital notes', notework: '✓', goodnotes: '✓', obsidian: '—', evernote: '—' },
  { feature: 'Voice recording to notes', notework: '✓', goodnotes: '—', obsidian: '—', evernote: '✓' },
  { feature: 'Built for students', notework: '✓', goodnotes: '✓', obsidian: '—', evernote: '—' },
]

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--m-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function Cell({ value, accent }: { value: string; accent?: boolean }) {
  if (value === '✓') return <Check />
  if (value === '—') return <span style={{ color: 'var(--m-text-3)', fontSize: '14px' }}>—</span>
  return (
    <span className="font-mono" style={{ color: accent ? 'var(--m-accent)' : 'var(--m-text-2)', fontSize: '12px' }}>
      {value}
    </span>
  )
}

export default function ComparisonTable() {
  return (
    <section id="compare" style={{ padding: '7rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <FadeUp>
        <div className="label" style={{ marginBottom: '1rem' }}>
          Comparison
        </div>
        <h2
          className="font-serif-d"
          style={{
            fontSize: 'clamp(2rem, 4.2vw, 48px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '1.25rem',
            color: 'var(--m-text)',
            fontWeight: 400,
          }}
        >
          What <em style={{ fontStyle: 'italic', color: 'var(--m-accent)' }}>no other tool</em> does.
        </h2>
        <p style={{ fontSize: '17px', color: 'var(--m-text-2)', maxWidth: 560, marginBottom: '3rem', lineHeight: 1.7 }}>
          Every tool in this space solves a part of the problem. Notework solves the part they all ignore.
        </p>

        <div
          style={{
            overflowX: 'auto',
            background: 'var(--m-surface)',
            border: '1px solid var(--m-border)',
            borderRadius: 16,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th
                  className="font-syne"
                  style={{
                    textAlign: 'left',
                    padding: '1rem 1.25rem',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--m-text-3)',
                    borderBottom: '1px solid var(--m-border)',
                    width: '32%',
                  }}
                >
                  Feature
                </th>
                <th
                  className="font-syne"
                  style={{
                    textAlign: 'left',
                    padding: '1rem 1.25rem',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--m-accent)',
                    borderBottom: '1px solid var(--m-accent-border)',
                    background: 'var(--m-accent-dim)',
                  }}
                >
                  Notework
                </th>
                {['GoodNotes', 'Obsidian', 'Evernote'].map((col) => (
                  <th
                    key={col}
                    className="font-syne"
                    style={{
                      textAlign: 'left',
                      padding: '1rem 1.25rem',
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--m-text-3)',
                      borderBottom: '1px solid var(--m-border)',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className="cmp-row"
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <td
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: i < rows.length - 1 ? '1px solid var(--m-border)' : 'none',
                      color: 'var(--m-text)',
                      fontWeight: 400,
                      verticalAlign: 'middle',
                    }}
                  >
                    {row.feature}
                  </td>
                  <td
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: i < rows.length - 1 ? '1px solid var(--m-border)' : 'none',
                      background: 'var(--m-accent-dim)',
                      verticalAlign: 'middle',
                    }}
                  >
                    <Cell value={row.notework} accent />
                  </td>
                  {[row.goodnotes, row.obsidian, row.evernote].map((val, j) => (
                    <td
                      key={j}
                      style={{
                        padding: '1rem 1.25rem',
                        borderBottom: i < rows.length - 1 ? '1px solid var(--m-border)' : 'none',
                        color: 'var(--m-text-2)',
                        verticalAlign: 'middle',
                      }}
                    >
                      <Cell value={val} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeUp>
    </section>
  )
}
