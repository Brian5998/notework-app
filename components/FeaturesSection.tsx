import FeatureBlock from './FeatureBlock'

const searchPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--m-surface)"/>
    <rect x="16" y="16" width="308" height="36" rx="18" fill="var(--m-surface-raised)" stroke="var(--m-accent)" strokeWidth="0.8"/>
    <text x="36" y="39" fontFamily="'DM Mono','ui-monospace',monospace" fontSize="11" fill="var(--m-text-2)">mitochondria energy production</text>
    <circle cx="312" cy="34" r="10" fill="var(--m-accent)"/>
    <circle cx="309" cy="31" r="4.5" fill="none" stroke="#0C0C0E" strokeWidth="1.4"/>
    <line x1="312" y1="35" x2="316" y2="39" stroke="#0C0C0E" strokeWidth="1.4" strokeLinecap="round"/>
    <rect x="16" y="66" width="308" height="32" rx="6" fill="var(--m-surface-raised)" stroke="var(--m-border)" strokeWidth="0.5"/>
    <circle cx="30" cy="82" r="4" fill="var(--m-accent)" opacity="0.85"/>
    <text x="42" y="87" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="var(--m-text)">Biology 201 — Oct 14th</text>
    <text x="260" y="87" fontFamily="'DM Mono',monospace" fontSize="9" fill="var(--m-accent)">98% match</text>
    <rect x="16" y="104" width="308" height="32" rx="6" fill="var(--m-surface-raised)" stroke="var(--m-border)" strokeWidth="0.5"/>
    <circle cx="30" cy="120" r="4" fill="var(--m-accent)" opacity="0.55"/>
    <text x="42" y="125" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="var(--m-text)">Chemistry lecture — Sep 28th</text>
    <text x="260" y="125" fontFamily="'DM Mono',monospace" fontSize="9" fill="var(--m-accent)">84% match</text>
    <rect x="16" y="142" width="308" height="32" rx="6" fill="var(--m-surface-raised)" stroke="var(--m-border)" strokeWidth="0.5"/>
    <circle cx="30" cy="158" r="4" fill="var(--m-accent)" opacity="0.32"/>
    <text x="42" y="163" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="var(--m-text)">Study group notes — Nov 2nd</text>
    <text x="260" y="163" fontFamily="'DM Mono',monospace" fontSize="9" fill="var(--m-accent)">71% match</text>
  </svg>
)

const contradictionPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--m-surface)"/>
    <rect x="16" y="16" width="145" height="80" rx="8" fill="var(--m-surface-raised)" stroke="var(--m-border-bright)" strokeWidth="0.5"/>
    <text x="26" y="36" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-text-3)">SEP 18</text>
    <text x="26" y="52" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--m-text)">Mitosis splits the</text>
    <text x="26" y="65" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--m-text)">nucleus into two.</text>
    <text x="26" y="85" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--m-text-3)">→ identical copies</text>
    <rect x="179" y="16" width="145" height="80" rx="8" fill="var(--m-surface-raised)" stroke="var(--m-amber)" strokeWidth="0.9"/>
    <text x="189" y="36" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-text-3)">NOV 4</text>
    <text x="189" y="52" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--m-text)">Mitosis produces 4</text>
    <text x="189" y="65" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--m-text)">daughter cells.</text>
    <text x="189" y="85" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--m-amber)">← conflict detected</text>
    <line x1="162" y1="56" x2="178" y2="56" stroke="var(--m-amber)" strokeWidth="1" strokeDasharray="3 2"/>
    <rect x="16" y="118" width="308" height="52" rx="8" fill="var(--m-amber-dim)" stroke="var(--m-amber)" strokeWidth="0.5"/>
    <text x="30" y="140" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="var(--m-amber)" fontWeight="600">Contradiction detected</text>
    <text x="30" y="156" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--m-text-2)">These two notes describe mitosis differently. Which is correct?</text>
    <text x="240" y="162" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--m-amber)" fontWeight="600">Resolve →</text>
  </svg>
)

const linkingPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--m-surface)"/>
    <rect x="16" y="16" width="308" height="40" rx="8" fill="var(--m-surface-raised)" stroke="var(--m-border)" strokeWidth="0.5"/>
    <text x="30" y="41" fontFamily="'DM Sans',sans-serif" fontSize="10" fill="var(--m-text)">Homeostasis — Biology 201, Nov 9th</text>
    <rect x="16" y="72" width="308" height="60" rx="8" fill="var(--m-accent-dim)" stroke="var(--m-accent-border)" strokeWidth="0.5"/>
    <text x="30" y="92" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--m-accent)" fontWeight="600">Related note suggested</text>
    <text x="30" y="108" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--m-text-2)">&quot;Feedback loops&quot; — Chemistry, Oct 3rd</text>
    <text x="30" y="122" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--m-text-2)">Both describe self-regulating systems</text>
    <rect x="210" y="139" width="50" height="22" rx="6" fill="var(--m-accent)"/>
    <text x="226" y="155" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#0C0C0E" fontWeight="600">Confirm</text>
    <rect x="268" y="139" width="50" height="22" rx="6" fill="transparent" stroke="var(--m-border-bright)" strokeWidth="0.5"/>
    <text x="282" y="155" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--m-text-2)">Dismiss</text>
    <text x="30" y="153" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-accent)" opacity="0.7">87% confidence</text>
    <text x="16" y="178" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="var(--m-text-3)">2 other suggestions pending →</text>
  </svg>
)

const forestPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--m-surface)"/>
    {/* cluster 1: Biology */}
    <circle cx="90" cy="80" r="48" fill="var(--m-accent)" opacity="0.06" stroke="var(--m-accent)" strokeWidth="0.5" strokeDasharray="4 3"/>
    <circle cx="90" cy="80" r="14" fill="var(--m-accent)" opacity="0.3"/>
    <circle cx="90" cy="80" r="7" fill="var(--m-accent)"/>
    <circle cx="60" cy="55" r="5" fill="var(--m-surface-raised)" stroke="var(--m-accent)" strokeWidth="0.8"/>
    <circle cx="120" cy="55" r="5" fill="var(--m-surface-raised)" stroke="var(--m-accent)" strokeWidth="0.8"/>
    <circle cx="55" cy="100" r="5" fill="var(--m-surface-raised)" stroke="var(--m-accent)" strokeWidth="0.8"/>
    <circle cx="125" cy="100" r="5" fill="var(--m-surface-raised)" stroke="var(--m-accent)" strokeWidth="0.8"/>
    <line x1="90" y1="80" x2="60" y2="55" stroke="var(--m-accent)" strokeWidth="0.7" opacity="0.5"/>
    <line x1="90" y1="80" x2="120" y2="55" stroke="var(--m-accent)" strokeWidth="0.7" opacity="0.5"/>
    <line x1="90" y1="80" x2="55" y2="100" stroke="var(--m-accent)" strokeWidth="0.7" opacity="0.5"/>
    <line x1="90" y1="80" x2="125" y2="100" stroke="var(--m-accent)" strokeWidth="0.7" opacity="0.5"/>
    <text x="90" y="146" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="9" fill="var(--m-accent)">Biology</text>
    {/* cluster 2: Chemistry */}
    <circle cx="240" cy="80" r="42" fill="var(--m-accent)" opacity="0.06" stroke="var(--m-accent)" strokeWidth="0.5" strokeDasharray="4 3"/>
    <circle cx="240" cy="80" r="12" fill="var(--m-accent)" opacity="0.22"/>
    <circle cx="240" cy="80" r="6" fill="var(--m-accent)" opacity="0.7"/>
    <circle cx="212" cy="60" r="5" fill="var(--m-surface-raised)" stroke="var(--m-accent)" strokeWidth="0.6" opacity="0.7"/>
    <circle cx="268" cy="60" r="5" fill="var(--m-surface-raised)" stroke="var(--m-accent)" strokeWidth="0.6" opacity="0.7"/>
    <circle cx="270" cy="100" r="5" fill="var(--m-surface-raised)" stroke="var(--m-accent)" strokeWidth="0.6" opacity="0.7"/>
    <line x1="240" y1="80" x2="212" y2="60" stroke="var(--m-accent)" strokeWidth="0.7" opacity="0.4"/>
    <line x1="240" y1="80" x2="268" y2="60" stroke="var(--m-accent)" strokeWidth="0.7" opacity="0.4"/>
    <line x1="240" y1="80" x2="270" y2="100" stroke="var(--m-accent)" strokeWidth="0.7" opacity="0.4"/>
    <text x="240" y="135" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="9" fill="var(--m-accent)" opacity="0.85">Chemistry</text>
    {/* cross-cluster link */}
    <line x1="125" y1="100" x2="212" y2="60" stroke="var(--m-border-bright)" strokeWidth="0.7" strokeDasharray="4 3" opacity="0.6"/>
    <circle cx="168" cy="80" r="3" fill="var(--m-surface)" stroke="var(--m-border-bright)" strokeWidth="0.6"/>
    {/* cluster 3 */}
    <circle cx="168" cy="160" r="28" fill="var(--m-text-2)" opacity="0.05" stroke="var(--m-text-2)" strokeWidth="0.5" strokeDasharray="4 3"/>
    <circle cx="168" cy="160" r="6" fill="var(--m-text-2)" opacity="0.3"/>
    <circle cx="168" cy="160" r="3" fill="var(--m-text-2)"/>
    <text x="168" y="183" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-text-2)">Study skills</text>
  </svg>
)

const quizPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--m-surface)"/>
    <rect x="16" y="12" width="308" height="28" rx="6" fill="var(--m-accent-dim)"/>
    <rect x="20" y="16" width="116" height="20" rx="4" fill="var(--m-accent)" opacity="0.4"/>
    <text x="26" y="31" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-accent)" fontWeight="600">3 / 5 QUESTIONS</text>
    <text x="24" y="60" fontFamily="'DM Sans',sans-serif" fontSize="10.5" fill="var(--m-text)" fontWeight="500">What process converts glucose into ATP?</text>
    <rect x="16" y="74" width="308" height="26" rx="6" fill="var(--m-surface-raised)" stroke="var(--m-border)" strokeWidth="0.5"/>
    <text x="30" y="92" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--m-text)">A) Photosynthesis</text>
    <rect x="16" y="106" width="308" height="26" rx="6" fill="var(--m-accent-dim)" stroke="var(--m-accent)" strokeWidth="0.8"/>
    <text x="30" y="124" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--m-accent)" fontWeight="600">B) Cellular respiration ✓</text>
    <rect x="16" y="138" width="308" height="26" rx="6" fill="var(--m-surface-raised)" stroke="var(--m-border)" strokeWidth="0.5"/>
    <text x="30" y="156" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="var(--m-text)">C) Fermentation</text>
    <text x="16" y="184" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-text-3)">Source: Biology 201 — Oct 14th</text>
  </svg>
)

const insightsPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--m-surface)"/>
    <text x="16" y="28" fontFamily="'DM Mono',monospace" fontSize="9" fill="var(--m-text-2)" fontWeight="600">CONCEPT FREQUENCY</text>
    <text x="16" y="52" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--m-text-2)">Mitosis</text>
    <rect x="80" y="42" width="200" height="14" rx="3" fill="var(--m-accent)" opacity="0.85"/>
    <text x="286" y="53" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-text-3)">8</text>
    <text x="16" y="74" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--m-text-2)">ATP</text>
    <rect x="80" y="64" width="150" height="14" rx="3" fill="var(--m-accent)" opacity="0.6"/>
    <text x="236" y="75" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-text-3)">6</text>
    <text x="16" y="96" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--m-text-2)">Enzymes</text>
    <rect x="80" y="86" width="100" height="14" rx="3" fill="var(--m-accent)" opacity="0.4"/>
    <text x="186" y="97" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-text-3)">4</text>
    <line x1="16" y1="118" x2="324" y2="118" stroke="var(--m-border)" strokeWidth="0.5"/>
    <text x="16" y="138" fontFamily="'DM Mono',monospace" fontSize="9" fill="var(--m-text-2)" fontWeight="600">KNOWLEDGE EVOLUTION</text>
    <circle cx="40" cy="160" r="4" fill="var(--m-accent)"/>
    <text x="50" y="163" fontFamily="'DM Mono',monospace" fontSize="7.5" fill="var(--m-text-3)">initial</text>
    <line x1="80" y1="160" x2="130" y2="160" stroke="var(--m-border-bright)" strokeWidth="0.7"/>
    <circle cx="140" cy="160" r="4" fill="var(--m-text)"/>
    <text x="150" y="163" fontFamily="'DM Mono',monospace" fontSize="7.5" fill="var(--m-text-3)">deepened</text>
    <line x1="195" y1="160" x2="230" y2="160" stroke="var(--m-border-bright)" strokeWidth="0.7"/>
    <circle cx="240" cy="160" r="4" fill="var(--m-amber)"/>
    <text x="250" y="163" fontFamily="'DM Mono',monospace" fontSize="7.5" fill="var(--m-text-3)">revised</text>
    <text x="16" y="185" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--m-text-3)">Track how your understanding of &quot;Mitosis&quot; evolved</text>
  </svg>
)

const voicePreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--m-surface)"/>
    <circle cx="80" cy="70" r="32" fill="var(--m-accent)" opacity="0.08"/>
    <circle cx="80" cy="70" r="22" fill="var(--m-accent)" opacity="0.18"/>
    <rect x="74" y="52" width="12" height="22" rx="6" fill="var(--m-accent)"/>
    <path d="M68 68v4a12 12 0 0 0 24 0v-4" fill="none" stroke="var(--m-accent)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="80" y1="84" x2="80" y2="90" stroke="var(--m-accent)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M100 58 Q104 50 108 58" fill="none" stroke="var(--m-accent)" strokeWidth="1" opacity="0.6"/>
    <path d="M104 54 Q110 42 116 54" fill="none" stroke="var(--m-accent)" strokeWidth="1" opacity="0.4"/>
    <path d="M108 50 Q116 34 124 50" fill="none" stroke="var(--m-accent)" strokeWidth="1" opacity="0.2"/>
    <circle cx="80" cy="110" r="4" fill="var(--m-amber)"/>
    <text x="90" y="114" fontFamily="'DM Mono',monospace" fontSize="9" fill="var(--m-text-2)">2:34 recording</text>
    <rect x="160" y="20" width="164" height="160" rx="8" fill="var(--m-surface-raised)" stroke="var(--m-border)" strokeWidth="0.5"/>
    <text x="172" y="40" fontFamily="'DM Mono',monospace" fontSize="8" fill="var(--m-accent)" fontWeight="600">LIVE TRANSCRIPT</text>
    <text x="172" y="58" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--m-text)">The mitochondria is the</text>
    <text x="172" y="72" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--m-text)">powerhouse of the cell. It</text>
    <text x="172" y="86" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--m-text)">generates ATP through</text>
    <text x="172" y="100" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--m-text)">cellular respiration, which</text>
    <text x="172" y="114" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--m-text)">involves the electron</text>
    <text x="172" y="128" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="var(--m-text-3)" fontStyle="italic">transport chain...</text>
    <rect x="172" y="146" width="64" height="22" rx="6" fill="var(--m-accent)"/>
    <text x="192" y="161" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="#0C0C0E" fontWeight="600">Save Note</text>
  </svg>
)

const handwritingPreview = (
  <svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect x="0" y="0" width="340" height="200" rx="10" fill="var(--m-surface)"/>
    <rect x="16" y="16" width="148" height="168" rx="8" fill="var(--m-surface-raised)" stroke="var(--m-border-bright)" strokeWidth="0.5"/>
    <line x1="26" y1="40" x2="154" y2="40" stroke="var(--m-border)" strokeWidth="0.4"/>
    <line x1="26" y1="58" x2="154" y2="58" stroke="var(--m-border)" strokeWidth="0.4"/>
    <line x1="26" y1="76" x2="154" y2="76" stroke="var(--m-border)" strokeWidth="0.4"/>
    <line x1="26" y1="94" x2="154" y2="94" stroke="var(--m-border)" strokeWidth="0.4"/>
    <line x1="26" y1="112" x2="154" y2="112" stroke="var(--m-border)" strokeWidth="0.4"/>
    <path d="M30 36 Q40 32 50 36 Q60 40 70 36 Q80 32 90 36 Q100 40 110 36 Q120 32 130 36" fill="none" stroke="var(--m-text)" strokeWidth="1" opacity="0.55"/>
    <path d="M30 54 Q42 50 54 54 Q66 58 78 54 Q90 50 102 54 Q114 58 126 54 Q138 50 148 54" fill="none" stroke="var(--m-text)" strokeWidth="1" opacity="0.55"/>
    <path d="M30 72 Q38 68 46 72 Q54 76 62 72 Q70 68 78 72 Q86 76 94 72 Q102 68 118 72" fill="none" stroke="var(--m-text)" strokeWidth="1" opacity="0.55"/>
    <path d="M30 90 Q44 86 58 90 Q72 94 86 90 Q100 86 114 90 Q128 94 142 90" fill="none" stroke="var(--m-text)" strokeWidth="1" opacity="0.55"/>
    <path d="M30 108 Q40 104 50 108 Q60 112 70 108 Q80 104 90 108" fill="none" stroke="var(--m-text)" strokeWidth="1" opacity="0.55"/>
    <text x="90" y="150" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="7" fill="var(--m-text-3)">handwritten_notes.jpg</text>
    <defs>
      <marker id="hwArrow2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill="var(--m-accent)"/>
      </marker>
    </defs>
    <path d="M172 100 L192 100" stroke="var(--m-accent)" strokeWidth="1.5" markerEnd="url(#hwArrow2)"/>
    <text x="182" y="92" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="7" fill="var(--m-accent)" fontWeight="600">AI</text>
    <rect x="200" y="16" width="124" height="168" rx="8" fill="var(--m-surface-raised)" stroke="var(--m-accent)" strokeWidth="0.8"/>
    <text x="210" y="36" fontFamily="'DM Mono',monospace" fontSize="9" fill="var(--m-accent)" fontWeight="600">Converted Note</text>
    <text x="210" y="54" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--m-text)">Mitosis is the process</text>
    <text x="210" y="67" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--m-text)">of cell division that</text>
    <text x="210" y="80" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--m-text)">results in two identical</text>
    <text x="210" y="93" fontFamily="'DM Sans',sans-serif" fontSize="8" fill="var(--m-text)">daughter cells...</text>
    <line x1="210" y1="106" x2="314" y2="106" stroke="var(--m-border)" strokeWidth="0.5"/>
    <text x="210" y="122" fontFamily="'DM Mono',monospace" fontSize="7" fill="var(--m-accent)">✓ Searchable</text>
    <text x="210" y="136" fontFamily="'DM Mono',monospace" fontSize="7" fill="var(--m-accent)">✓ Linkable</text>
    <text x="210" y="150" fontFamily="'DM Mono',monospace" fontSize="7" fill="var(--m-accent)">✓ Quiz-ready</text>
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
  {
    num: '07 — Handwriting',
    title: 'Scan handwritten notes instantly',
    body: "Snap a photo of your handwritten lecture notes, problem sets, or whiteboard diagrams. Notework reads your handwriting with AI vision and converts it to searchable, linkable digital text — so nothing stays trapped on paper.",
    reverse: false,
    preview: handwritingPreview,
  },
  {
    num: '08 — Voice',
    title: 'Record audio, get text',
    body: "Hit record during a lecture, study session, or brainstorm. Notework transcribes your speech in real time — no uploads, no waiting. The transcript becomes a note you can search, link, quiz from, and cross-reference with everything else you've written.",
    reverse: true,
    preview: voicePreview,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '4rem 2.5rem 7rem', maxWidth: 1100, margin: '0 auto' }}>
      <div className="label" style={{ marginBottom: '1rem' }}>
        Core features
      </div>
      <h2
        className="font-serif-d"
        style={{
          fontSize: 'clamp(2rem, 4.2vw, 48px)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: '0',
          color: 'var(--m-text)',
          fontWeight: 400,
          maxWidth: 720,
        }}
      >
        What happens to your notes{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--m-accent)' }}>after</em> you write them.
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
