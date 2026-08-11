# Game Rankings MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a modern, dark-themed static website that lets anyone browse, filter, and search the ~28,800-row GameRankings.com score archive.

**Architecture:** A Vite + React + TypeScript single-page app renders one virtualized, sortable, filterable table over a JSON snapshot of the user's Google Sheet. A Node script regenerates that snapshot on demand. GitHub Actions builds and deploys the site to GitHub Pages on every push to `main`.

**Tech Stack:** Vite, React 18, TypeScript, @tanstack/react-table, @tanstack/react-virtual, csv-parse (build-time only), GitHub Actions, GitHub Pages.

## Global Constraints

- Data source of truth: Google Sheet `https://docs.google.com/spreadsheets/d/1rnHawH0zI0w6wa7TIazdOpk5lIrKKyYSkH5X9GFfYYc` (CSV export, gid `782449831`). Snapshot at publish time — never fetched live from the browser.
- No automated unit/e2e tests for this MVP (explicit spec decision) — every task is verified manually via `npm run dev` + browser check with a concrete expected result.
- Visual style: "Dark Data Dashboard" — background `#0b0e14` / row alt `#141824` / border `#1a1f2b` / text `#e6e9ef` / muted text `#6b7280` / faint text `#4a5568` / accent teal `#7dd3c0` / accent amber `#f0b429`.
- Table layout: hybrid dense row with a small (28×28) cover thumbnail — not a card grid, not a bare table.
- Default sort: Bayesian AVG (`bayesianAvg`) descending, matching the original site.
- Platform filter is multi-select. List of platforms: `PC, MAC, PS, PS2, PS3, PS4, PSP, VITA, SNES, N64, GC, WII, WIIU, NS, GB, GBC, GBA, DS, 3DS, XBOX, X360, XONE, GEN, SCD, SAT, DC, MOBI, NGE, IOS`.
- No pagination — infinite/virtualized scroll only.
- No detail pages, no admin panel — explicitly out of scope for this plan.
- JSON data file uses short keys (`t`, `p`, `y`, `a`, `r`, `d`, `i`, `b`) to minimize bundle size; `link`/`GameFAQs` columns are dropped (unused without detail pages).
- Spec reference: [docs/superpowers/specs/2026-08-11-game-rankings-design.md](../specs/2026-08-11-game-rankings-design.md)

---

### Task 1: Scaffold the Vite + React + TypeScript project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles/global.css`

**Interfaces:**
- Produces: an `App` default-export component rendered into `#root`; `npm run dev` / `npm run build` / `npm run preview` / `npm run sync-data` scripts that every later task relies on.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "game-rankings",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "sync-data": "node scripts/sync-data.mjs"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-table": "^8.20.5",
    "@tanstack/react-virtual": "^3.10.9"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "csv-parse": "^5.5.6"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 3: Create `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE_PATH is set by the GitHub Actions workflow (Task 10) so the
// built site works under https://<user>.github.io/<repo>/. Defaults to
// '/' for local dev.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
});
```

- [ ] **Step 6: Create `index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Game Rankings</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 8: Create `src/App.tsx`**

```tsx
export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Game Rankings</h1>
      <p>Proyecto en construcción.</p>
    </div>
  );
}
```

- [ ] **Step 9: Create `src/styles/global.css`**

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: completes with no errors, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 11: Verify the dev server**

Run: `npm run dev`
Expected: prints a `Local: http://localhost:5173/` URL. Open it in a browser — you should see a page with the heading "Game Rankings" and the text "Proyecto en construcción." Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html src/main.tsx src/App.tsx src/styles/global.css
git commit -m "Scaffold Vite + React + TypeScript project"
```

---

### Task 2: Data sync script — Google Sheet → `src/data/games.json`

**Files:**
- Create: `scripts/sync-data.mjs`
- Create: `src/data/games.json` (generated by running the script)

**Interfaces:**
- Consumes: nothing from earlier tasks (standalone Node script).
- Produces: `src/data/games.json` — a JSON array of objects shaped `{ id: number, t: string, p: string, y: number, a: number, r: number, d: string, i: string, b: number }`, which Task 3 consumes.

- [ ] **Step 1: Create `scripts/sync-data.mjs`**

```js
import { writeFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1rnHawH0zI0w6wa7TIazdOpk5lIrKKyYSkH5X9GFfYYc/export?format=csv&gid=782449831';

const OUTPUT_PATH = new URL('../src/data/games.json', import.meta.url);

// Explicit column order (rather than trusting the sheet's own header row)
// because the sheet has extra, unnamed documentation columns after
// "bayesian avg" that would otherwise collide as duplicate empty headers.
const COLUMNS = [
  'id',
  'title',
  'platform',
  'year',
  'avgScore',
  'reviews',
  'developer',
  'image',
  'link',
  'gamefaqs',
  'bayesianAvg',
];

async function main() {
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
  }
  const csvText = await res.text();

  const rows = parse(csvText, {
    columns: COLUMNS,
    from_line: 2, // skip the sheet's own header row
    relax_column_count: true, // some rows have extra documentation cells
    skip_empty_lines: true,
  });

  const games = [];
  for (const row of rows) {
    const id = Number(row.id);
    const title = (row.title ?? '').trim();
    if (!id || !title) continue; // skip blank/malformed rows

    games.push({
      id,
      t: title,
      p: (row.platform ?? '').trim(),
      y: Number(row.year) || 0,
      a: Number(row.avgScore) || 0,
      r: Number(row.reviews) || 0,
      d: (row.developer ?? '').trim(),
      i: (row.image ?? '').trim(),
      b: Number(row.bayesianAvg) || 0,
    });
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(games));
  console.log(`Wrote ${OUTPUT_PATH.pathname} with ${games.length} games.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the sync script**

Run: `npm run sync-data`
Expected: prints `Wrote .../src/data/games.json with NNNN games.` where NNNN is close to 28,800 (the sheet has 28,864 data rows; a small number may be dropped if blank).

- [ ] **Step 3: Verify the output file**

Run: `node -p "require('./src/data/games.json').length"`
Expected: prints the same number NNNN from Step 2.

Run: `node -p "require('./src/data/games.json')[0]"`
Expected: prints an object like `{ id: 915692, t: 'Super Mario Galaxy', p: 'WII', y: 2007, a: 97.64, r: 78, d: 'Nintendo', i: 'https://...', b: 97.45 }`.

- [ ] **Step 4: Commit**

```bash
git add scripts/sync-data.mjs src/data/games.json
git commit -m "Add Google Sheet data sync script and initial data snapshot"
```

---

### Task 3: Game types and data loader

**Files:**
- Create: `src/types.ts`
- Create: `src/data/loadGames.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `src/data/games.json` (Task 2).
- Produces: `Game` type and `loadGames(): Game[]` function, used by every remaining frontend task.

- [ ] **Step 1: Create `src/types.ts`**

```ts
export interface Game {
  id: number;
  title: string;
  platform: string;
  year: number;
  avgScore: number;
  reviews: number;
  developer: string;
  image: string;
  bayesianAvg: number;
}

export interface RawGame {
  id: number;
  t: string;
  p: string;
  y: number;
  a: number;
  r: number;
  d: string;
  i: string;
  b: number;
}
```

- [ ] **Step 2: Create `src/data/loadGames.ts`**

```ts
import raw from './games.json';
import type { Game, RawGame } from '../types';

export function loadGames(): Game[] {
  return (raw as RawGame[]).map((g) => ({
    id: g.id,
    title: g.t,
    platform: g.p,
    year: g.y,
    avgScore: g.a,
    reviews: g.r,
    developer: g.d,
    image: g.i,
    bayesianAvg: g.b,
  }));
}
```

- [ ] **Step 3: Modify `src/App.tsx` to load and count games**

```tsx
import { loadGames } from './data/loadGames';

const games = loadGames();

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Game Rankings</h1>
      <p>{games.length} juegos cargados.</p>
    </div>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`
Expected: the page shows "Game Rankings" and "NNNN juegos cargados." where NNNN matches the count from Task 2, Step 2/3. Stop the server once confirmed.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/data/loadGames.ts src/App.tsx
git commit -m "Add Game types and data loader"
```

---

### Task 4: Dark dashboard theme and app shell

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `.app`, `.app-header` CSS classes and a `<div className="app"><header className="app-header">...</header>...</div>` shell structure that Task 5+ render their content inside.

- [ ] **Step 1: Replace `src/styles/global.css`**

```css
:root {
  --color-bg: #0b0e14;
  --color-bg-alt: #141824;
  --color-border: #1a1f2b;
  --color-text: #e6e9ef;
  --color-text-muted: #6b7280;
  --color-text-faint: #4a5568;
  --color-accent: #7dd3c0;
  --color-accent-warm: #f0b429;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
}

.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.app-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.app-header .subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Modify `src/App.tsx` to use the shell**

```tsx
import { loadGames } from './data/loadGames';

const games = loadGames();

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Rankings</h1>
        <p className="subtitle">{games.length} juegos</p>
      </header>
    </div>
  );
}
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`
Expected: the page background is dark (`#0b0e14`), text is light, and the header text reads "Game Rankings" / "NNNN juegos" in a bottom-bordered header bar. Stop the server once confirmed.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css src/App.tsx
git commit -m "Apply dark dashboard theme and app shell"
```

---

### Task 5: Virtualized, sortable game table

**Files:**
- Create: `src/components/GameTable.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Game` type (Task 3); `.app`/`.app-header` shell (Task 4).
- Produces: `GameTable({ games, sorting, onSortingChange }: { games: Game[]; sorting: SortingState; onSortingChange: (s: SortingState) => void })`, a React component. `SortingState` is `@tanstack/react-table`'s exported type. Task 6/7/8 pass an already-filtered `games` array into this component; they do not touch its internals.

- [ ] **Step 1: Create `src/components/GameTable.tsx`**

```tsx
import { useRef } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Game } from '../types';

const columnHelper = createColumnHelper<Game>();

const columns = [
  columnHelper.display({
    id: 'rank',
    header: '#',
    cell: (info) => info.row.index + 1,
    size: 40,
  }),
  columnHelper.accessor('image', {
    header: '',
    enableSorting: false,
    size: 44,
    cell: (info) => (
      <img
        src={info.getValue()}
        alt=""
        loading="lazy"
        style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }}
        onError={(e) => {
          e.currentTarget.style.visibility = 'hidden';
        }}
      />
    ),
  }),
  columnHelper.accessor('title', {
    header: 'Título',
    size: 320,
  }),
  columnHelper.accessor('platform', {
    header: 'Plataforma',
    size: 90,
    cell: (info) => <span className="platform-badge">{info.getValue()}</span>,
  }),
  columnHelper.accessor('year', {
    header: 'Año',
    size: 70,
  }),
  columnHelper.accessor('developer', {
    header: 'Desarrollador',
    size: 220,
  }),
  columnHelper.accessor('reviews', {
    header: 'Reviews',
    size: 80,
  }),
  columnHelper.accessor('bayesianAvg', {
    header: 'Score',
    size: 80,
    cell: (info) => info.getValue().toFixed(2),
  }),
];

interface GameTableProps {
  games: Game[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
}

export function GameTable({ games, sorting, onSortingChange }: GameTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data: games,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 12,
  });

  return (
    <div className="game-table-scroll" ref={parentRef}>
      <div className="game-table-head">
        {table.getHeaderGroups().map((headerGroup) => (
          <div className="game-table-row game-table-row--head" key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <div
                className="game-table-cell"
                key={header.id}
                style={{
                  width: header.getSize(),
                  cursor: header.column.getCanSort() ? 'pointer' : undefined,
                }}
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? ''}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              className="game-table-row"
              key={row.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  className="game-table-cell"
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add table CSS to `src/styles/global.css`** (append)

```css
.game-table-scroll {
  flex: 1;
  overflow: auto;
  position: relative;
}

.game-table-head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-bg-alt);
}

.game-table-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.game-table-row--head {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--color-text-faint);
  user-select: none;
}

.game-table-cell {
  padding: 6px 10px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.platform-badge {
  display: inline-block;
  background: var(--color-bg);
  color: var(--color-accent);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 10px;
  padding: 2px 6px;
}
```

- [ ] **Step 3: Modify `src/App.tsx` to render the table**

```tsx
import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { loadGames } from './data/loadGames';
import { GameTable } from './components/GameTable';

const games = loadGames();

export default function App() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'bayesianAvg', desc: true }]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Rankings</h1>
        <p className="subtitle">{games.length} juegos</p>
      </header>
      <GameTable games={games} sorting={sorting} onSortingChange={setSorting} />
    </div>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`
Expected:
1. The table renders with columns `# | (cover) | Título | Plataforma | Año | Desarrollador | Reviews | Score`.
2. The first row is "Super Mario Galaxy" (WII, 2007) with score 97.45 — the default sort is Bayesian AVG descending.
3. Scrolling the table loads more rows smoothly (virtualized — inspect the DOM and confirm only a small number of row elements exist at any time, not 28,000).
4. Clicking the "Score" header once flips the sort to ascending (the first row changes to the lowest-scored game); clicking again flips back to descending.
5. Clicking "Título" sorts alphabetically by title.

Stop the server once confirmed.

- [ ] **Step 5: Commit**

```bash
git add src/components/GameTable.tsx src/styles/global.css src/App.tsx
git commit -m "Add virtualized, sortable game table"
```

---

### Task 6: Platform filter

**Files:**
- Create: `src/constants.ts`
- Create: `src/hooks/useGameFilters.ts`
- Create: `src/components/PlatformFilter.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Game` type (Task 3); `GameTable` (Task 5).
- Produces: `useGameFilters(games: Game[])` hook returning `{ selectedPlatforms: Set<string>, setSelectedPlatforms, search: string, setSearch, minReviews: number, setMinReviews, filtered: Game[], clearFilters: () => void }`. Task 7 and Task 8 consume `search`/`setSearch` and `minReviews`/`setMinReviews` from this same hook instance in `App.tsx` — they do not create their own state.

- [ ] **Step 1: Create `src/constants.ts`**

```ts
export const PLATFORMS = [
  'PC', 'MAC',
  'PS', 'PS2', 'PS3', 'PS4', 'PSP', 'VITA',
  'SNES', 'N64', 'GC', 'WII', 'WIIU', 'NS',
  'GB', 'GBC', 'GBA', 'DS', '3DS',
  'XBOX', 'X360', 'XONE',
  'GEN', 'SCD', 'SAT', 'DC',
  'MOBI', 'NGE', 'IOS',
];
```

- [ ] **Step 2: Create `src/hooks/useGameFilters.ts`**

```ts
import { useMemo, useState } from 'react';
import type { Game } from '../types';

export function useGameFilters(games: Game[]) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [minReviews, setMinReviews] = useState(0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return games.filter((game) => {
      if (selectedPlatforms.size > 0 && !selectedPlatforms.has(game.platform)) {
        return false;
      }
      if (game.reviews < minReviews) {
        return false;
      }
      if (query && !game.title.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [games, selectedPlatforms, search, minReviews]);

  function clearFilters() {
    setSelectedPlatforms(new Set());
    setSearch('');
    setMinReviews(0);
  }

  return {
    selectedPlatforms,
    setSelectedPlatforms,
    search,
    setSearch,
    minReviews,
    setMinReviews,
    filtered,
    clearFilters,
  };
}
```

- [ ] **Step 3: Create `src/components/PlatformFilter.tsx`**

```tsx
import { PLATFORMS } from '../constants';

interface PlatformFilterProps {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function PlatformFilter({ selected, onChange }: PlatformFilterProps) {
  function toggle(platform: string) {
    const next = new Set(selected);
    if (next.has(platform)) {
      next.delete(platform);
    } else {
      next.add(platform);
    }
    onChange(next);
  }

  return (
    <div className="platform-filter">
      <button
        type="button"
        className={selected.size === 0 ? 'chip chip--active' : 'chip'}
        onClick={() => onChange(new Set())}
      >
        Todas
      </button>
      {PLATFORMS.map((platform) => (
        <button
          key={platform}
          type="button"
          className={selected.has(platform) ? 'chip chip--active' : 'chip'}
          onClick={() => toggle(platform)}
        >
          {platform}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Add filter bar CSS to `src/styles/global.css`** (append)

```css
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.platform-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  background: var(--color-bg-alt);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 10px;
  padding: 3px 8px;
  cursor: pointer;
}

.chip--active {
  color: var(--color-accent);
  border-color: var(--color-accent);
}
```

- [ ] **Step 5: Modify `src/App.tsx` to wire the filter**

```tsx
import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { loadGames } from './data/loadGames';
import { GameTable } from './components/GameTable';
import { PlatformFilter } from './components/PlatformFilter';
import { useGameFilters } from './hooks/useGameFilters';

const games = loadGames();

export default function App() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'bayesianAvg', desc: true }]);
  const { selectedPlatforms, setSelectedPlatforms, filtered } = useGameFilters(games);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Rankings</h1>
        <p className="subtitle">{filtered.length} de {games.length} juegos</p>
      </header>
      <div className="filter-bar">
        <PlatformFilter selected={selectedPlatforms} onChange={setSelectedPlatforms} />
      </div>
      <GameTable games={filtered} sorting={sorting} onSortingChange={setSorting} />
    </div>
  );
}
```

- [ ] **Step 6: Verify in the browser**

Run: `npm run dev`
Expected:
1. A row of platform chip buttons appears below the header, starting with a "Todas" chip that's highlighted by default (no platform filter active).
2. Clicking "NS" highlights it (teal border/text), un-highlights "Todas", and the table shrinks to only Nintendo Switch games; the header count updates (e.g. "1234 de 28864 juegos").
3. Clicking "PS4" in addition to "NS" shows games from either platform.
4. Clicking "NS" again deselects it and removes that filter.
5. Clicking "Todas" clears all platform selections and re-highlights itself.

Stop the server once confirmed.

- [ ] **Step 7: Commit**

```bash
git add src/constants.ts src/hooks/useGameFilters.ts src/components/PlatformFilter.tsx src/styles/global.css src/App.tsx
git commit -m "Add multi-select platform filter"
```

---

### Task 7: Title search

**Files:**
- Create: `src/components/SearchBox.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `search`/`setSearch` from `useGameFilters` (Task 6), already instantiated in `App.tsx`.
- Produces: `SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void })`.

- [ ] **Step 1: Create `src/components/SearchBox.tsx`**

```tsx
interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <input
      type="text"
      className="search-box"
      placeholder="Buscar por título..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
```

- [ ] **Step 2: Add search box CSS to `src/styles/global.css`** (append)

```css
.search-box {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  min-width: 200px;
}

.search-box::placeholder {
  color: var(--color-text-faint);
}
```

- [ ] **Step 3: Modify `src/App.tsx` to wire the search box**

```tsx
import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { loadGames } from './data/loadGames';
import { GameTable } from './components/GameTable';
import { PlatformFilter } from './components/PlatformFilter';
import { SearchBox } from './components/SearchBox';
import { useGameFilters } from './hooks/useGameFilters';

const games = loadGames();

export default function App() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'bayesianAvg', desc: true }]);
  const { selectedPlatforms, setSelectedPlatforms, search, setSearch, filtered } =
    useGameFilters(games);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Rankings</h1>
        <p className="subtitle">{filtered.length} de {games.length} juegos</p>
      </header>
      <div className="filter-bar">
        <PlatformFilter selected={selectedPlatforms} onChange={setSelectedPlatforms} />
        <SearchBox value={search} onChange={setSearch} />
      </div>
      <GameTable games={filtered} sorting={sorting} onSortingChange={setSorting} />
    </div>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`
Expected:
1. A search input appears next to the platform chips.
2. Typing "mario" shows only rows whose title contains "mario" (case-insensitive) — e.g. "Super Mario Galaxy", "Super Mario Odyssey".
3. Clearing the input restores the full (or platform-filtered) list.
4. Search combines with an active platform filter (e.g. "NS" + "zelda" shows only Switch Zelda games).

Stop the server once confirmed.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchBox.tsx src/styles/global.css src/App.tsx
git commit -m "Add title search"
```

---

### Task 8: Minimum reviews filter and clear-filters button

**Files:**
- Create: `src/components/ReviewsFilter.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `minReviews`/`setMinReviews`/`clearFilters` from `useGameFilters` (Task 6), already instantiated in `App.tsx`.
- Produces: `ReviewsFilter({ value, onChange }: { value: number; onChange: (v: number) => void })`.

- [ ] **Step 1: Create `src/components/ReviewsFilter.tsx`**

```tsx
interface ReviewsFilterProps {
  value: number;
  onChange: (value: number) => void;
}

export function ReviewsFilter({ value, onChange }: ReviewsFilterProps) {
  return (
    <label className="reviews-filter">
      Reviews mínimas:
      <input
        type="number"
        min={0}
        className="reviews-filter-input"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  );
}
```

- [ ] **Step 2: Add reviews filter + clear button CSS to `src/styles/global.css`** (append)

```css
.reviews-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.reviews-filter-input {
  width: 60px;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 12px;
}

.clear-filters-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  margin-left: auto;
}

.clear-filters-btn:hover {
  color: var(--color-text);
  border-color: var(--color-text-muted);
}
```

- [ ] **Step 3: Modify `src/App.tsx` to wire the reviews filter and clear button**

```tsx
import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { loadGames } from './data/loadGames';
import { GameTable } from './components/GameTable';
import { PlatformFilter } from './components/PlatformFilter';
import { SearchBox } from './components/SearchBox';
import { ReviewsFilter } from './components/ReviewsFilter';
import { useGameFilters } from './hooks/useGameFilters';

const games = loadGames();

export default function App() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'bayesianAvg', desc: true }]);
  const {
    selectedPlatforms,
    setSelectedPlatforms,
    search,
    setSearch,
    minReviews,
    setMinReviews,
    filtered,
    clearFilters,
  } = useGameFilters(games);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Game Rankings</h1>
        <p className="subtitle">{filtered.length} de {games.length} juegos</p>
      </header>
      <div className="filter-bar">
        <PlatformFilter selected={selectedPlatforms} onChange={setSelectedPlatforms} />
        <SearchBox value={search} onChange={setSearch} />
        <ReviewsFilter value={minReviews} onChange={setMinReviews} />
        <button type="button" className="clear-filters-btn" onClick={clearFilters}>
          Limpiar filtros
        </button>
      </div>
      <GameTable games={filtered} sorting={sorting} onSortingChange={setSorting} />
    </div>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`
Expected:
1. A "Reviews mínimas" number input and a "Limpiar filtros" button appear in the filter bar.
2. Setting it to 50 removes games with fewer than 50 reviews (e.g. search "Super Metroid" — it has 10 reviews and should disappear; clear the search and confirm the count dropped).
3. Selecting a platform, typing a search term, and setting min reviews, then clicking "Limpiar filtros" resets all three controls and the full game count reappears.

Stop the server once confirmed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ReviewsFilter.tsx src/styles/global.css src/App.tsx
git commit -m "Add minimum reviews filter and clear filters button"
```

---

### Task 9: Create the GitHub repository and push

> ⚠️ This task creates a public GitHub repository and pushes code to it — a real, visible action. Confirm with the user before running Step 2.

**Files:** none (repository/remote operations only).

**Interfaces:** none — this task only sets up `origin` for Task 10's GitHub Actions workflow to run against.

- [ ] **Step 1: Ensure the local branch is named `main`**

Run: `git branch -M main`
Expected: no output (or silent success); `git branch --show-current` prints `main`.

- [ ] **Step 2: Create the GitHub repository and push (confirm with the user first)**

Run: `gh repo create game-rankings --public --source=. --remote=origin --description "Modern browser for the GameRankings.com score archive" --push`
Expected: output includes `✓ Created repository <owner>/game-rankings on GitHub` and `✓ Pushed commits to https://github.com/<owner>/game-rankings.git`.

- [ ] **Step 3: Verify**

Run: `git remote -v`
Expected: `origin` points to `https://github.com/<owner>/game-rankings.git` (fetch and push).

Run: `git log origin/main --oneline -1`
Expected: shows the same commit as `git log --oneline -1` (local and remote `main` match).

No commit needed for this task — it only pushes existing commits.

---

### Task 10: GitHub Actions deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md` (deploy instructions; created fresh, see Step 3)

**Interfaces:**
- Consumes: `origin` remote from Task 9; `npm run build` (Task 1) which must produce a working `dist/` folder using every file from Tasks 1–8.
- Produces: a live site at `https://<owner>.github.io/game-rankings/`.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_BASE_PATH: /${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Enable GitHub Pages with "GitHub Actions" as the source**

Run: `gh api --method POST /repos/{owner}/game-rankings/pages -f build_type=workflow`
Expected: JSON response describing the new Pages site (or a message that Pages is already enabled — in that case run `gh api --method PUT /repos/{owner}/game-rankings/pages -f build_type=workflow` instead).

- [ ] **Step 3: Create `README.md`**

```markdown
# Game Rankings

Navegador moderno del archivo de scores de GameRankings.com.

## Desarrollo

    npm install
    npm run dev

## Actualizar datos

Los datos vienen de un snapshot de un Google Sheet, no de una API en vivo.
Para traer juegos nuevos que hayas agregado al Sheet:

    npm run sync-data
    git add src/data/games.json
    git commit -m "Sync data"
    git push

Un push a `main` reconstruye y republica el sitio automáticamente.

## Deploy

Automático vía GitHub Actions (`.github/workflows/deploy.yml`) a GitHub
Pages en cada push a `main`.
```

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "Add GitHub Pages deploy workflow and README"
git push
```

- [ ] **Step 5: Watch the deploy and verify the live site**

Run: `gh run watch`
Expected: the run selector shows the just-pushed "Deploy to GitHub Pages" run; it finishes with both `build` and `deploy` jobs green.

Open `https://<owner>.github.io/game-rankings/` in a browser (replace `<owner>` with your GitHub username).
Expected: the same dark-themed, filterable, sortable game table you verified locally in Tasks 5–8, now live on the public URL.

---

## Post-plan follow-ups (not in scope here)

- Game detail pages (per-game view with larger cover, links to original GameRankings/GameFAQs pages).
- Admin form for adding games without touching the Google Sheet directly.
- Custom domain for the GitHub Pages site.
