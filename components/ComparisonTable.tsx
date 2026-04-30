import FadeUp from './FadeUp'

type Cell = '✓' | '—' | string

type Row = {
  feature: string
  hero?: boolean
  notework: Cell
  notion: Cell
  obsidian: Cell
  goodnotes: Cell
  glean: Cell
}

const COMPETITORS = ['Notion', 'Obsidian', 'GoodNotes', 'Glean'] as const

const rows: Row[] = [
  {
    feature: 'Tells you when you\u2019ve contradicted yourself',
    hero: true,
    notework: '✓',
    notion: '—',
    obsidian: '—',
    goodnotes: '—',
    glean: '—',
  },
  {
    feature: 'Surfaces concepts neighboring your search',
    hero: true,
    notework: '✓',
    notion: '—',
    obsidian: 'Manual graph',
    goodnotes: '—',
    glean: 'Enterprise only',
  },
  {
    feature: 'Suggested concept linking (you confirm)',
    notework: '✓',
    notion: '—',
    obsidian: 'Manual',
    goodnotes: '—',
    glean: '—',
  },
  {
    feature: 'Visual knowledge map of your notes',
    notework: '✓',
    notion: '—',
    obsidian: '✓',
    goodnotes: '—',
    glean: '—',
  },
  {
    feature: 'Quiz generated from your own notes',
    notework: '✓',
    notion: '—',
    obsidian: '—',
    goodnotes: '—',
    glean: '—',
  },
  {
    feature: 'Auto-generated study sheets per cluster',
    notework: '✓',
    notion: '—',
    obsidian: '—',
    goodnotes: '—',
    glean: '—',
  },
  {
    feature: 'Tracks how your understanding evolves',
    notework: '✓',
    notion: '—',
    obsidian: 'Version history',
    goodnotes: '—',
    glean: '—',
  },
  {
    feature: 'Semantic search across all your notes',
    notework: '✓',
    notion: 'Basic',
    obsidian: 'Plugin',
    goodnotes: '—',
    glean: '✓',
  },
  {
    feature: 'Handwriting capture',
    notework: 'OCR',
    notion: '—',
    obsidian: '—',
    goodnotes: '✓',
    glean: '—',
  },
  {
    feature: 'Voice recording \u2192 note',
    notework: '✓',
    notion: '—',
    obsidian: '—',
    goodnotes: 'Limited',
    glean: '—',
  },
  {
    feature: 'Designed for individual students',
    notework: '✓',
    notion: 'Generic',
    obsidian: 'Power users',
    goodnotes: '✓',
    glean: 'Enterprise',
  },
  {
    feature: 'Free to start',
    notework: '✓',
    notion: '✓',
    obsidian: '✓',
    goodnotes: 'Trial',
    glean: '—',
  },
]

function Check({ accent }: { accent?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={accent ? 'var(--m-accent)' : 'var(--m-text-2)'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CellRender({ value, accent }: { value: Cell; accent?: boolean }) {
  if (value === '✓') return <Check accent={accent} />
  if (value === '—')
    return (
      <span style={{ color: 'var(--m-text-3)', fontSize: '15px' }}>—</span>
    )
  return (
    <span
      className="font-mono"
      style={{
        color: accent ? 'var(--m-accent)' : 'var(--m-text-2)',
        fontSize: '12px',
      }}
    >
      {value}
    </span>
  )
}

export default function ComparisonTable() {
  return (
    <section
      id="compare"
      style={{ padding: '7rem 2.5rem', maxWidth: 1180, margin: '0 auto' }}
    >
      <FadeUp>
        <div className="label" style={{ marginBottom: '1rem' }}>
          Comparison
        </div>
        <h2
          className="font-serif-d"
          style={{
            fontSize: 'clamp(2rem, 4.2vw, 52px)',
            lineHeight: 1.08,
            letterSpacing: '-0.022em',
            marginBottom: '1.25rem',
            color: 'var(--m-text)',
            fontWeight: 400,
          }}
        >
          What{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--m-accent)' }}>
            no other tool
          </em>{' '}
          does.
        </h2>
        <p
          style={{
            fontSize: '18px',
            color: 'var(--m-text-2)',
            maxWidth: 640,
            marginBottom: '3rem',
            lineHeight: 1.65,
          }}
        >
          Every tool in this space solves a part of the problem. The two rows at the
          top are the part they all ignore — and the reason students keep
          contradicting themselves on midterms.
        </p>

        <div
          style={{
            overflowX: 'auto',
            background: 'var(--m-surface)',
            border: '1px solid var(--m-border)',
            borderRadius: 18,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '15px',
              minWidth: 720,
            }}
          >
            <thead>
              <tr>
                <th
                  className="font-syne"
                  style={{
                    textAlign: 'left',
                    padding: '1.1rem 1.35rem',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--m-text-3)',
                    borderBottom: '1px solid var(--m-border)',
                    width: '40%',
                  }}
                >
                  Feature
                </th>
                <th
                  className="font-syne"
                  style={{
                    textAlign: 'center',
                    padding: '1.1rem 1.35rem',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--m-accent)',
                    borderBottom: '1px solid var(--m-accent-border)',
                    background: 'var(--m-accent-dim)',
                  }}
                >
                  Notework
                </th>
                {COMPETITORS.map((col) => (
                  <th
                    key={col}
                    className="font-syne"
                    style={{
                      textAlign: 'center',
                      padding: '1.1rem 1.35rem',
                      fontWeight: 700,
                      fontSize: '12px',
                      letterSpacing: '0.14em',
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
              {rows.map((row, i) => {
                const isLast = i === rows.length - 1
                return (
                  <tr
                    key={row.feature}
                    className="cmp-row"
                    style={{
                      background: row.hero
                        ? 'rgba(126,232,162,0.04)'
                        : i % 2 === 0
                          ? 'transparent'
                          : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <td
                      style={{
                        padding: '1.05rem 1.35rem',
                        borderBottom: isLast ? 'none' : '1px solid var(--m-border)',
                        color: 'var(--m-text)',
                        fontWeight: row.hero ? 600 : 400,
                        verticalAlign: 'middle',
                      }}
                    >
                      {row.hero && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--m-accent)',
                            marginRight: 10,
                            verticalAlign: 'middle',
                            boxShadow: '0 0 8px var(--m-accent)',
                          }}
                        />
                      )}
                      {row.feature}
                    </td>
                    <td
                      style={{
                        padding: '1.05rem 1.35rem',
                        borderBottom: isLast ? 'none' : '1px solid var(--m-border)',
                        background: 'var(--m-accent-dim)',
                        verticalAlign: 'middle',
                        textAlign: 'center',
                      }}
                    >
                      <CellRender value={row.notework} accent />
                    </td>
                    {[row.notion, row.obsidian, row.goodnotes, row.glean].map(
                      (val, j) => (
                        <td
                          key={j}
                          style={{
                            padding: '1.05rem 1.35rem',
                            borderBottom: isLast
                              ? 'none'
                              : '1px solid var(--m-border)',
                            color: 'var(--m-text-2)',
                            verticalAlign: 'middle',
                            textAlign: 'center',
                          }}
                        >
                          <CellRender value={val} />
                        </td>
                      ),
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--m-text-3)',
            marginTop: '1.25rem',
            textAlign: 'right',
          }}
        >
          Comparison reflects each product&apos;s default behavior, not its plugin
          ecosystem.
        </p>
      </FadeUp>
    </section>
  )
}
