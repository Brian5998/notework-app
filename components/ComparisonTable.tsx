import FadeUp from './FadeUp'

const rows = [
  {
    feature: 'Semantic search',
    notework: '✓',
    goodnotes: '—',
    obsidian: 'Plugin only',
    evernote: 'Basic',
  },
  {
    feature: 'Contradiction detection',
    notework: '✓',
    goodnotes: '—',
    obsidian: '—',
    evernote: '—',
  },
  {
    feature: 'Suggested concept linking',
    notework: '✓',
    goodnotes: '—',
    obsidian: 'Manual only',
    evernote: '—',
  },
  {
    feature: 'Visual knowledge map',
    notework: '✓',
    goodnotes: '—',
    obsidian: '✓',
    evernote: '—',
  },
  {
    feature: 'Quiz from your notes',
    notework: '✓',
    goodnotes: '—',
    obsidian: '—',
    evernote: '—',
  },
  {
    feature: 'Knowledge evolution tracking',
    notework: '✓',
    goodnotes: '—',
    obsidian: '—',
    evernote: '—',
  },
  {
    feature: 'Concept heatmap',
    notework: '✓',
    goodnotes: '—',
    obsidian: '—',
    evernote: '—',
  },
  {
    feature: 'Timeline view',
    notework: '✓',
    goodnotes: '—',
    obsidian: '—',
    evernote: '—',
  },
  {
    feature: 'Built for students',
    notework: '✓',
    goodnotes: '✓',
    obsidian: '—',
    evernote: '—',
  },
]

function Cell({ value }: { value: string }) {
  if (value === '✓') {
    return <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>✓</span>
  }
  if (value === '—') {
    return <span style={{ color: 'var(--ink-faint)', fontSize: '1rem' }}>—</span>
  }
  return <span style={{ color: 'var(--ink-muted)', fontSize: '0.8rem' }}>{value}</span>
}

export default function ComparisonTable() {
  return (
    <section id="compare" style={{ padding: '7rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <FadeUp>
        <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
          Comparison
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 'clamp(1.9rem, 3.5vw, 2.7rem)',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            color: 'var(--ink)',
          }}
        >
          What no other tool does.
        </h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--ink-muted)', maxWidth: 520, marginBottom: '2.5rem' }}>
          Every tool in this space solves a part of the problem. Notework solves the part they all ignore.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 500, fontSize: '0.8rem', color: 'var(--ink-muted)', borderBottom: '0.5px solid var(--border-strong)', width: '30%' }}></th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    color: 'var(--accent)',
                    borderBottom: '0.5px solid var(--border-strong)',
                    background: 'var(--accent-light)',
                    borderRadius: '8px 8px 0 0',
                  }}
                >
                  Notework
                </th>
                {['GoodNotes', 'Obsidian', 'Evernote'].map((col) => (
                  <th
                    key={col}
                    style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 500, fontSize: '0.8rem', color: 'var(--ink-muted)', borderBottom: '0.5px solid var(--border-strong)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature}>
                  <td
                    style={{
                      padding: '1rem',
                      borderBottom: i < rows.length - 1 ? '0.5px solid var(--border)' : 'none',
                      color: 'var(--ink)',
                      fontWeight: 400,
                      verticalAlign: 'middle',
                    }}
                  >
                    {row.feature}
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      borderBottom: i < rows.length - 1 ? '0.5px solid var(--border)' : 'none',
                      background: 'var(--accent-light)',
                      verticalAlign: 'middle',
                    }}
                  >
                    <Cell value={row.notework} />
                  </td>
                  {[row.goodnotes, row.obsidian, row.evernote].map((val, j) => (
                    <td
                      key={j}
                      style={{
                        padding: '1rem',
                        borderBottom: i < rows.length - 1 ? '0.5px solid var(--border)' : 'none',
                        color: 'var(--ink-muted)',
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
