import FeatureBlock from './FeatureBlock'

const searchPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '90%', height: '90%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--bg)"/>
    <rect x="16" y="16" width="308" height="36" rx="18" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="0.8"/>
    <text x="36" y="39" fontFamily="'DM Sans',sans-serif" fontSize="11" fill="var(--ink-muted)">mitochondria energy production</text>
    <circle cx="312" cy="34" r="10" fill="var(--accent)"/>
    <circle cx="309" cy="31" r="4.5" fill="none" stroke="white" strokeWidth="1.2"/>
    <line x1="312" y1="35" x2="316" y2="39" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    <rect x="16" y="66" width="308" height="32" rx="6" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5"/>
    <circle cx="30" cy="82" r="5" fill="var(--accent)" opacity="0.7"/>
    <text x="42" y="87" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="var(--ink)">Biology 201 — Oct 14th</text>
    <text x="260" y="87" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--accent)">98% match</text>
    <rect x="16" y="104" width="308" height="32" rx="6" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5"/>
    <circle cx="30" cy="120" r="5" fill="var(--accent)" opacity="0.5"/>
    <text x="42" y="125" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="var(--ink)">Chemistry lecture — Sep 28th</text>
    <text x="260" y="125" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--accent)">84% match</text>
    <rect x="16" y="142" width="308" height="32" rx="6" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5"/>
    <circle cx="30" cy="158" r="5" fill="var(--accent)" opacity="0.3"/>
    <text x="42" y="163" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="var(--ink)">Study group notes — Nov 2nd</text>
    <text x="260" y="163" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--accent)">71% match</text>
  </svg>
)

const contradictionPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '90%', height: '90%' }}>
    <rect x="16" y="16" width="145" height="80" rx="8" fill="var(--bg)" stroke="var(--border-strong)" strokeWidth="0.5"/>
    <text x="26" y="36" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--ink-faint)">Sep 18th</text>
    <text x="26" y="52" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--ink)" fontWeight="400">Mitosis splits the</text>
    <text x="26" y="65" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--ink)">nucleus into two.</text>
    <text x="26" y="85" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--ink-faint)">→ identical copies</text>
    <rect x="179" y="16" width="145" height="80" rx="8" fill="var(--bg)" stroke="#E24B4A" strokeWidth="0.8"/>
    <text x="189" y="36" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--ink-faint)">Nov 4th</text>
    <text x="189" y="52" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--ink)">Mitosis produces 4</text>
    <text x="189" y="65" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--ink)">daughter cells.</text>
    <text x="189" y="85" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="#E24B4A">← conflict detected</text>
    <line x1="162" y1="56" x2="178" y2="56" stroke="#E24B4A" strokeWidth="1" strokeDasharray="3 2"/>
    <text x="164" y="52" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#E24B4A">⚡</text>
    <rect x="16" y="118" width="308" height="52" rx="8" fill="#FCEBEB" stroke="#F7C1C1" strokeWidth="0.5"/>
    <text x="30" y="140" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="#A32D2D" fontWeight="500">Contradiction detected</text>
    <text x="30" y="156" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#A32D2D" opacity="0.75">These two notes describe mitosis differently. Which is correct?</text>
    <text x="240" y="162" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#A32D2D" fontWeight="500">Resolve →</text>
  </svg>
)

const linkingPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '90%', height: '90%' }}>
    <rect x="16" y="16" width="308" height="40" rx="8" fill="var(--bg)" stroke="var(--border)" strokeWidth="0.5"/>
    <text x="30" y="41" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="var(--ink)">Homeostasis — Biology 201, Nov 9th</text>
    <rect x="16" y="72" width="308" height="60" rx="8" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="0.5"/>
    <text x="30" y="92" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--accent)" fontWeight="500">💡 Related note suggested</text>
    <text x="30" y="108" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--ink-muted)">&quot;Feedback loops&quot; — Chemistry, Oct 3rd</text>
    <text x="30" y="122" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--ink-muted)">Both describe self-regulating systems</text>
    <rect x="210" y="139" width="50" height="22" rx="11" fill="var(--accent)"/>
    <text x="226" y="155" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="white">Confirm</text>
    <rect x="268" y="139" width="50" height="22" rx="11" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5"/>
    <text x="282" y="155" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--ink-muted)">Dismiss</text>
    <text x="30" y="153" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--accent)" opacity="0.7">Confidence: 87%</text>
    <rect x="16" y="148" width="130" height="0.5" fill="var(--border)"/>
    <text x="16" y="178" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--ink-faint)">2 other suggestions pending →</text>
  </svg>
)

const forestPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '90%', height: '90%' }}>
    {/* cluster 1: Biology */}
    <circle cx="90" cy="80" r="48" fill="var(--accent)" opacity="0.07" stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="4 3"/>
    <circle cx="90" cy="80" r="14" fill="var(--accent)" opacity="0.3"/>
    <circle cx="90" cy="80" r="7" fill="var(--accent)"/>
    <circle cx="60" cy="55" r="6" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="0.8"/>
    <circle cx="120" cy="55" r="6" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="0.8"/>
    <circle cx="55" cy="100" r="6" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="0.8"/>
    <circle cx="125" cy="100" r="6" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="0.8"/>
    <line x1="90" y1="80" x2="60" y2="55" stroke="var(--accent)" strokeWidth="0.7" opacity="0.5"/>
    <line x1="90" y1="80" x2="120" y2="55" stroke="var(--accent)" strokeWidth="0.7" opacity="0.5"/>
    <line x1="90" y1="80" x2="55" y2="100" stroke="var(--accent)" strokeWidth="0.7" opacity="0.5"/>
    <line x1="90" y1="80" x2="125" y2="100" stroke="var(--accent)" strokeWidth="0.7" opacity="0.5"/>
    <text x="90" y="146" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--accent)">Biology</text>
    {/* cluster 2: Chemistry */}
    <circle cx="240" cy="80" r="42" fill="var(--accent-mid)" opacity="0.06" stroke="var(--accent-mid)" strokeWidth="0.5" strokeDasharray="4 3"/>
    <circle cx="240" cy="80" r="12" fill="var(--accent-mid)" opacity="0.25"/>
    <circle cx="240" cy="80" r="6" fill="var(--accent-mid)"/>
    <circle cx="212" cy="60" r="5" fill="var(--bg-card)" stroke="var(--accent-mid)" strokeWidth="0.8"/>
    <circle cx="268" cy="60" r="5" fill="var(--bg-card)" stroke="var(--accent-mid)" strokeWidth="0.8"/>
    <circle cx="270" cy="100" r="5" fill="var(--bg-card)" stroke="var(--accent-mid)" strokeWidth="0.8"/>
    <line x1="240" y1="80" x2="212" y2="60" stroke="var(--accent-mid)" strokeWidth="0.7" opacity="0.5"/>
    <line x1="240" y1="80" x2="268" y2="60" stroke="var(--accent-mid)" strokeWidth="0.7" opacity="0.5"/>
    <line x1="240" y1="80" x2="270" y2="100" stroke="var(--accent-mid)" strokeWidth="0.7" opacity="0.5"/>
    <text x="240" y="135" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--accent-mid)">Chemistry</text>
    {/* cross-cluster link */}
    <line x1="125" y1="100" x2="212" y2="60" stroke="var(--border-strong)" strokeWidth="0.7" strokeDasharray="4 3" opacity="0.6"/>
    <circle cx="168" cy="80" r="4" fill="var(--bg)" stroke="var(--border-strong)" strokeWidth="0.6"/>
    {/* cluster 3: smaller */}
    <circle cx="168" cy="160" r="28" fill="var(--ink-faint)" opacity="0.05" stroke="var(--ink-faint)" strokeWidth="0.5" strokeDasharray="4 3"/>
    <circle cx="168" cy="160" r="6" fill="var(--ink-faint)" opacity="0.3"/>
    <circle cx="168" cy="160" r="3" fill="var(--ink-faint)"/>
    <text x="168" y="183" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--ink-faint)">Study skills</text>
  </svg>
)

const quizPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '90%', height: '90%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--bg)"/>
    <rect x="16" y="12" width="308" height="28" rx="6" fill="var(--accent-light)"/>
    <rect x="20" y="16" width="116" height="20" rx="10" fill="var(--accent)" opacity="0.3"/>
    <text x="26" y="31" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--accent)" fontWeight="500">3 / 5 QUESTIONS</text>
    <text x="24" y="60" fontFamily="'DM Sans',sans-serif" fontSize="10.5" fill="var(--ink)" fontWeight="500">What process converts glucose into ATP?</text>
    <rect x="16" y="74" width="308" height="26" rx="6" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5"/>
    <text x="30" y="92" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--ink)">A) Photosynthesis</text>
    <rect x="16" y="106" width="308" height="26" rx="6" fill="var(--accent-light)" stroke="var(--accent)" strokeWidth="0.8"/>
    <text x="30" y="124" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--accent)" fontWeight="500">B) Cellular respiration ✓</text>
    <rect x="16" y="138" width="308" height="26" rx="6" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5"/>
    <text x="30" y="156" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--ink)">C) Fermentation</text>
    <text x="16" y="184" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--ink-faint)">Source: Biology 201 — Oct 14th</text>
  </svg>
)

const insightsPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '90%', height: '90%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--bg)"/>
    <text x="16" y="28" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--ink-muted)" fontWeight="500">CONCEPT FREQUENCY</text>
    {/* Bars */}
    <text x="16" y="52" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--ink-muted)">Mitosis</text>
    <rect x="80" y="42" width="200" height="14" rx="3" fill="var(--accent)" opacity="0.8"/>
    <text x="286" y="53" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--ink-faint)">8</text>
    <text x="16" y="74" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--ink-muted)">ATP</text>
    <rect x="80" y="64" width="150" height="14" rx="3" fill="var(--accent)" opacity="0.6"/>
    <text x="236" y="75" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--ink-faint)">6</text>
    <text x="16" y="96" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--ink-muted)">Enzymes</text>
    <rect x="80" y="86" width="100" height="14" rx="3" fill="var(--accent)" opacity="0.4"/>
    <text x="186" y="97" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--ink-faint)">4</text>
    {/* Evolution section */}
    <line x1="16" y1="118" x2="324" y2="118" stroke="var(--border)" strokeWidth="0.5"/>
    <text x="16" y="138" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--ink-muted)" fontWeight="500">KNOWLEDGE EVOLUTION</text>
    <circle cx="40" cy="160" r="4" fill="var(--accent)"/>
    <text x="50" y="163" fontFamily="'DM Sans',sans-serif" fontSize="7.5" fill="var(--ink-faint)">initial</text>
    <line x1="80" y1="160" x2="130" y2="160" stroke="var(--border-strong)" strokeWidth="0.7"/>
    <circle cx="140" cy="160" r="4" fill="#3B82F6"/>
    <text x="150" y="163" fontFamily="'DM Sans',sans-serif" fontSize="7.5" fill="var(--ink-faint)">deepened</text>
    <line x1="195" y1="160" x2="230" y2="160" stroke="var(--border-strong)" strokeWidth="0.7"/>
    <circle cx="240" cy="160" r="4" fill="#D97706"/>
    <text x="250" y="163" fontFamily="'DM Sans',sans-serif" fontSize="7.5" fill="var(--ink-faint)">revised</text>
    <text x="16" y="185" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--ink-faint)">Track how your understanding of &quot;Mitosis&quot; evolved</text>
  </svg>
)

const features = [
  {
    num: '01 — Search',
    title: 'Semantic search across everything',
    body: "Type a concept. Surface every note you've ever written that touches it — across classes, dates, and formats. No folders. No tags. No exact-match keywords. Just what you mean.",
    reverse: false,
    preview: searchPreview,
  },
  {
    num: '02 — Consistency',
    title: 'Contradiction flagging',
    body: 'If you wrote something in September that conflicts with something in November, Notework flags it. You resolve it yourself — the system just makes sure you see it. No competitor does this.',
    reverse: true,
    preview: contradictionPreview,
  },
  {
    num: '03 — Linking',
    title: 'Suggested concept linking',
    body: 'Rather than auto-building a knowledge graph, Notework surfaces connections and lets you confirm or dismiss them. You stay in control. The AI reduces search costs.',
    reverse: false,
    preview: linkingPreview,
  },
  {
    num: '04 — Forest View',
    title: 'A map of your confirmed knowledge',
    body: 'A visual map of your concept clusters — built from your decisions over time, not generated by the system. You see the shape of your own understanding.',
    reverse: true,
    preview: forestPreview,
  },
  {
    num: '05 — Quiz Mode',
    title: 'Test yourself with your own notes',
    body: "Generate quizzes directly from what you've written. Multiple choice, true/false, short answer — all sourced from your actual notes, not a textbook. Understand what you know and what you don't.",
    reverse: false,
    preview: quizPreview,
  },
  {
    num: '06 — Insights',
    title: 'Track how your knowledge evolves',
    body: 'See which concepts you revisit most and how your understanding changes over time. A heatmap of your intellectual footprint, and a timeline of how each idea deepened, revised, or contradicted itself.',
    reverse: true,
    preview: insightsPreview,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '2rem 2.5rem 7rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
        Core features
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontSize: 'clamp(1.9rem, 3.5vw, 2.7rem)',
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '0',
          color: 'var(--ink)',
        }}
      >
        What happens to your notes
        <br />
        <em style={{ fontStyle: 'italic' }}>after</em> you write them.
      </h2>

      {features.map((f) => (
        <FeatureBlock
          key={f.num}
          num={f.num}
          title={f.title}
          body={f.body}
          reverse={f.reverse}
          preview={f.preview}
        />
      ))}
    </section>
  )
}
