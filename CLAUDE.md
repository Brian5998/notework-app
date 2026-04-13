@AGENTS.md

# Notework

AI-powered knowledge infrastructure for students. Semantic search, contradiction detection, and concept linking across all your notes.

## Setup

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                   # http://localhost:3000
```

Get an API key at https://console.anthropic.com.

## Stack

- **Next.js 16.2.3** — app router. Read AGENTS.md before touching Next.js APIs.
- **Tailwind CSS v4** — no `tailwind.config.ts`. Theme lives in `app/globals.css`.
- **TypeScript** — strict mode.
- **Anthropic SDK** — all AI features use `claude-opus-4-6`.
- **framer-motion** — scroll animations via `FadeUp` component.
- **Storage** — `localStorage` + React context (`lib/NotesContext.tsx`). No database.

## File structure

```
app/
  layout.tsx              # Root layout: fonts, NotesProvider, html/body
  page.tsx                # Marketing landing page
  globals.css             # CSS vars + @theme inline (Tailwind v4 theme)
  app/
    page.tsx              # Notes app shell (/app route)
  api/
    waitlist/route.ts     # POST — logs email signups
    search/route.ts       # POST { query, notes } → { results: [{id, reason}] }
    contradictions/route.ts # POST { notes } → { contradictions: [{noteIds, explanation}] }
    suggestions/route.ts  # POST { currentNote, otherNotes } → { suggestions: [{id, reason}] }
lib/
  types.ts                # Note type: { id, title, content, createdAt }
  NotesContext.tsx        # Global notes state, localStorage persistence, useNotes() hook
components/
  app/
    NotesList.tsx         # Sidebar note list with create/delete
    NoteEditor.tsx        # Title + textarea, auto-saves on 500ms debounce
    SearchBar.tsx         # Search input, submits on Enter
    SearchResults.tsx     # Ranked results with Claude's reason per match
    ContradictionPanel.tsx # Badge + dropdown, polls after every note save (2s debounce)
    SuggestionsPanel.tsx  # "Related" sidebar, triggers 1.2s after opening/editing a note
  Navbar.tsx / Hero.tsx / ProblemSection.tsx / FeaturesSection.tsx
  FeatureBlock.tsx / ComparisonTable.tsx / PricingSection.tsx
  WaitlistSection.tsx / Footer.tsx / FadeUp.tsx  # Landing page components
```

## Notes data model

```ts
type Note = {
  id: string        // crypto.randomUUID()
  title: string
  content: string
  createdAt: string // ISO string
}
```

All notes live in React context, hydrated from `localStorage` on mount. No backend DB.

## AI API routes

All routes call `claude-opus-4-6`, parse JSON from the response, and return `[]` gracefully on any error.

| Route | Input | Output |
|-------|-------|--------|
| `/api/search` | `{ query, notes }` | `{ results: [{id, reason}] }` |
| `/api/contradictions` | `{ notes }` | `{ contradictions: [{noteIds, explanation}] }` |
| `/api/suggestions` | `{ currentNote, otherNotes }` | `{ suggestions: [{id, reason}] }` |

## Theming

CSS custom properties in `app/globals.css`, dark mode via `@media (prefers-color-scheme: dark)`:

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `#F7F5F0` | `#111210` |
| `--bg-card` | `#EFEDE7` | `#1C1C1A` |
| `--ink` | `#1A1917` | `#F0EEE8` |
| `--ink-muted` | `#6B6860` | `#9E9C95` |
| `--accent` | `#2D5A3D` | `#5CB87A` |
| `--accent-light` | `#D6E8DC` | `#1A3526` |

Do **not** use Tailwind `dark:` variants. Add new tokens in `globals.css` under `@theme inline`.

## Component conventions

- Add `'use client'` to any component using event handlers, `useState`/`useEffect`, framer-motion, or browser APIs.
- Use `var(--token)` in inline styles. Tailwind utilities are fine for layout.
- SVG attributes in JSX must be camelCase: `strokeWidth`, `strokeDasharray`, `textAnchor`, `fontFamily`, `viewBox`, etc.

## Gotchas

- **Apostrophes in JSX strings**: use double quotes (`"you'll"`) or `&apos;` — single-quoted JS strings with apostrophes break the TypeScript compiler.
- **Server vs Client components**: `onMouseEnter`, `onClick`, etc. cannot exist in Server Components — add `'use client'`.
- **Tailwind v4**: no config file — add theme tokens directly in `globals.css` under `@theme inline`.
