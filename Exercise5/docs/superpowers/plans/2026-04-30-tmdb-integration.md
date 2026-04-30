# TMDB Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TMDB type-ahead suggestions in the add/edit movie form, plus a list/grid view toggle so posters can be displayed at thumbnail or card size, persisting the user's choice in localStorage.

**Architecture:** A `searchMovies` Server Action keeps the TMDB API key server-side and returns simplified results to a new `TmdbCombobox` client component. Three nullable columns (`tmdb_id`, `poster_path`, `overview`) added to `movies` via additive migration. `MovieList` adds a view-mode state, `<ViewToggle>` button, and a parallel grid render path. `next/image` is used so TMDB-hosted images get optimized.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase Postgres + Auth, `@supabase/ssr`, CSS Modules, TMDB v3 search API.

**Spec:** [`Exercise5/docs/superpowers/specs/2026-04-30-tmdb-integration-design.md`](../specs/2026-04-30-tmdb-integration-design.md)

**Note on TDD:** The existing Exercise5 codebase has no automated test infrastructure (matching its v1 spec). To stay consistent and YAGNI for a learning project, this plan uses manual end-to-end verification (lint + build + browser smoke tests from the spec's Verification section) rather than introducing a test framework. If the user later wants to add Vitest/Playwright, that's a separate plan.

**Working directory:** `c:/Users/AyaanAhmed/Desktop/Practice/Exercise5/`

**Commit cadence:** four commits total — one per phase (Phase 1: backend, Phase 2: form, Phase 3: list/grid, Phase 4: docs + verify).

---

## File map

### New files
| Path                                              | Responsibility                                              |
|---------------------------------------------------|-------------------------------------------------------------|
| `supabase/migrations/2026-04-30-tmdb.sql`         | Additive schema migration (3 columns + index)               |
| `app/movies/poster.ts`                            | Pure util — build CDN URL from `poster_path`                |
| `app/movies/tmdb.ts`                              | Server Action `searchMovies` + `TmdbResult` type            |
| `app/movies/TmdbCombobox.tsx`                     | Client — title input + dropdown of TMDB matches             |
| `app/movies/TmdbCombobox.module.css`              | Combobox styling                                            |
| `app/movies/ViewToggle.tsx`                       | Client — list/grid icon toggle                              |
| `app/movies/PosterImage.tsx`                      | Client — `<Image>` wrapper with sage placeholder fallback   |

### Modified files
| Path                                              | Change                                                      |
|---------------------------------------------------|-------------------------------------------------------------|
| `next.config.ts`                                  | Whitelist `image.tmdb.org` for `next/image`                 |
| `.env.local.example` and `.env.local`             | Add `TMDB_API_KEY=`                                         |
| `app/movies/types.ts`                             | Add `tmdb_id`, `poster_path`, `overview` to types           |
| `app/movies/actions.ts`                           | Validate + persist new fields                               |
| `app/movies/MovieForm.tsx`                        | Replace title input with `<TmdbCombobox>`; carry new fields |
| `app/movies/MovieForm.module.css`                 | Spacing tweaks (no layout change)                           |
| `app/movies/MovieList.tsx`                        | View-mode state, `<ViewToggle>`, grid render branch         |
| `app/movies/MovieList.module.css`                 | `.thumbInRow`, `.grid`, `.card`, `.cardPoster`, `.cardRating`, `.cardDelete` |
| `README.md`                                       | TMDB key setup + run-the-migration section                  |

---

# Phase 1 — Backend, schema, util, server action

## Task 1: Schema migration file

**Files:**
- Create: `supabase/migrations/2026-04-30-tmdb.sql`

- [ ] **Step 1: Create the migration file**

Path: `Exercise5/supabase/migrations/2026-04-30-tmdb.sql`

```sql
alter table public.movies
  add column if not exists tmdb_id     int  null,
  add column if not exists poster_path text null
    check (poster_path is null or char_length(poster_path) <= 200),
  add column if not exists overview    text null
    check (overview is null or char_length(overview) <= 4000);

create index if not exists movies_user_tmdb_idx
  on public.movies (user_id, tmdb_id)
  where tmdb_id is not null;
```

- [ ] **Step 2: Apply it in Supabase**

Open Supabase dashboard → **SQL Editor → New query** → paste the file contents → **Run**.
Then **Table Editor → movies** → confirm the three new columns appear.
(This is a manual step — the local code can't reach the hosted database directly.)

- [ ] **Step 3: Update `supabase/schema.sql` so a fresh setup gets the full schema in one paste**

In `Exercise5/supabase/schema.sql`, locate the `create table if not exists public.movies (...)` block and add three lines before `created_at`:

```sql
  tmdb_id     int  null,
  poster_path text null
              check (poster_path is null or char_length(poster_path) <= 200),
  overview    text null
              check (overview is null or char_length(overview) <= 4000),
```

Then below the existing `create index ... movies_user_title_idx` line, add:

```sql
create index if not exists movies_user_tmdb_idx
  on public.movies (user_id, tmdb_id)
  where tmdb_id is not null;
```

(The migration file is the source of truth for users on the v1 schema; `schema.sql` is updated so new users on a fresh project get everything from one paste.)

## Task 2: Update types

**Files:**
- Modify: `app/movies/types.ts`

- [ ] **Step 1: Add the three optional fields to both types**

Replace the entire contents of `app/movies/types.ts` with:

```ts
export type Movie = {
  id: string;
  user_id: string;
  title: string;
  year: number | null;
  rating: number;
  notes: string | null;
  watched_on: string | null; // ISO date string (YYYY-MM-DD)
  created_at: string;
  tmdb_id: number | null;
  poster_path: string | null;
  overview: string | null;
};

export type MovieInput = {
  title: string;
  year: number | null;
  rating: number;
  notes: string | null;
  watched_on: string | null;
  tmdb_id: number | null;
  poster_path: string | null;
  overview: string | null;
};
```

## Task 3: Poster URL util

**Files:**
- Create: `app/movies/poster.ts`

- [ ] **Step 1: Create the util**

```ts
// app/movies/poster.ts
export type PosterSize = "w92" | "w342";

export function posterUrl(
  path: string | null | undefined,
  size: PosterSize = "w92",
): string | null {
  if (!path) return null;
  const trimmed = path.replace(/^\//, "");
  return `https://image.tmdb.org/t/p/${size}/${trimmed}`;
}
```

## Task 4: Whitelist TMDB images

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace the file**

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
    ],
  },
};

export default nextConfig;
```

## Task 5: TMDB API key in env

**Files:**
- Modify: `.env.local.example`, `.env.local`

- [ ] **Step 1: Add to `.env.local.example`**

Append a line so the file reads:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-project-settings-api
TMDB_API_KEY=your-tmdb-v4-read-access-token
```

- [ ] **Step 2: Add the real key to `.env.local`**

The user needs to obtain a TMDB *v4 Read Access Token* (not the v3 API key):
1. Sign up at https://www.themoviedb.org/signup
2. Go to **Settings → API → Create** (free, instant for personal use; "Developer" type)
3. Copy the **API Read Access Token** (long JWT-style string starting with `eyJ`)

Append to `.env.local`:
```
TMDB_API_KEY=<paste-token-here>
```

(The plan code uses the v4 Bearer-token style: `Authorization: Bearer ${TMDB_API_KEY}`. If the user only has a v3 key — short hex string — the call must use `?api_key=...` instead. The implementer should ask which one they have if unclear.)

## Task 6: TMDB Server Action

**Files:**
- Create: `app/movies/tmdb.ts`

- [ ] **Step 1: Create the file**

```ts
"use server";

export type TmdbResult = {
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
  overview: string | null;
};

export type SearchResponse = {
  results: TmdbResult[];
  error?: string;
};

type TmdbApiMovie = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  poster_path: string | null;
  overview?: string | null;
};

const ENDPOINT = "https://api.themoviedb.org/3/search/movie";
const TIMEOUT_MS = 5000;

export async function searchMovies(query: string): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { results: [] };

  const token = process.env.TMDB_API_KEY;
  if (!token) {
    return { results: [], error: "TMDB key not configured" };
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("query", trimmed);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return { results: [] };
    const data = (await res.json()) as { results?: TmdbApiMovie[] };
    const results = (data.results ?? []).slice(0, 6).map(toTmdbResult);
    return { results };
  } catch {
    return { results: [] };
  } finally {
    clearTimeout(timer);
  }
}

function toTmdbResult(m: TmdbApiMovie): TmdbResult {
  const yearMatch = m.release_date?.match(/^(\d{4})/);
  return {
    tmdb_id: m.id,
    title: m.title ?? m.name ?? "",
    year: yearMatch ? Number(yearMatch[1]) : null,
    poster_path: m.poster_path,
    overview: m.overview && m.overview.trim().length > 0 ? m.overview : null,
  };
}
```

## Task 7: Update server actions to accept new fields

**Files:**
- Modify: `app/movies/actions.ts`

- [ ] **Step 1: Replace `validate` and `normalize` with versions that handle the new fields**

Replace the `validate` function (lines 11–23) with:

```ts
const POSTER_PATH_RE = /^\/[A-Za-z0-9_./-]+$/;

function validate(input: MovieInput): string | null {
  const title = input.title?.trim() ?? "";
  if (title.length < 1 || title.length > 200) return "Title must be 1–200 characters.";
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)
    return "Rating must be between 1 and 5.";
  if (input.year !== null) {
    if (!Number.isInteger(input.year) || input.year < 1888 || input.year > CURRENT_YEAR + 5)
      return `Year must be between 1888 and ${CURRENT_YEAR + 5}.`;
  }
  if (input.notes !== null && input.notes.length > 2000)
    return "Notes must be 2000 characters or fewer.";
  if (input.tmdb_id !== null && !Number.isInteger(input.tmdb_id))
    return "Invalid TMDB id.";
  if (input.poster_path !== null) {
    if (input.poster_path.length > 200 || !POSTER_PATH_RE.test(input.poster_path))
      return "Invalid poster path.";
  }
  if (input.overview !== null && input.overview.length > 4000)
    return "Overview must be 4000 characters or fewer.";
  return null;
}
```

Replace the `normalize` function (lines 25–33) with:

```ts
function normalize(input: MovieInput): MovieInput {
  return {
    title: input.title.trim(),
    year: input.year,
    rating: input.rating,
    notes: input.notes && input.notes.trim().length > 0 ? input.notes.trim() : null,
    watched_on: input.watched_on && input.watched_on.length > 0 ? input.watched_on : null,
    tmdb_id: input.tmdb_id,
    poster_path: input.poster_path,
    overview: input.overview && input.overview.trim().length > 0 ? input.overview.trim() : null,
  };
}
```

The rest of `actions.ts` (createMovie / updateMovie / deleteMovie) doesn't need changes — they spread `normalize(input)` into the insert/update, so the new fields flow through automatically.

## Task 8: Phase 1 verification + commit

- [ ] **Step 1: Lint + build**

```bash
cd Exercise5
npm run lint
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
  TMDB_API_KEY="placeholder" \
  npm run build
```

Expected: lint clean (no output), build succeeds with the same route table as before plus a confirmation that compilation succeeded. The `/movies` route stays Dynamic (`ƒ`).

- [ ] **Step 2: Smoke-test the Server Action with curl-equivalent**

Open `localhost:3000/login`, sign in (existing user), open browser devtools console, paste:

```js
const r = await fetch("/movies", { method: "GET" });
console.log("movies page reachable:", r.status);
```

Expected: status `200`. (The Server Action itself isn't directly callable from the console without wiring; we'll verify it through the UI in Phase 2.)

- [ ] **Step 3: Commit**

```bash
git add Exercise5/supabase/migrations/2026-04-30-tmdb.sql \
        Exercise5/supabase/schema.sql \
        Exercise5/app/movies/types.ts \
        Exercise5/app/movies/poster.ts \
        Exercise5/app/movies/tmdb.ts \
        Exercise5/app/movies/actions.ts \
        Exercise5/next.config.ts \
        Exercise5/.env.local.example
git commit -m "Exercise5: TMDB schema migration + searchMovies Server Action

Adds tmdb_id/poster_path/overview columns (additive migration), a server
action that hits TMDB's /search/movie with the v4 token, and supporting
util/types. Validation in actions.ts persists the new fields end-to-end.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

(`.env.local` is gitignored — its real key never gets staged.)

---

# Phase 2 — Combobox in MovieForm

## Task 9: PosterImage component (used in Phase 3 too)

**Files:**
- Create: `app/movies/PosterImage.tsx`

- [ ] **Step 1: Create the wrapper**

```tsx
"use client";

import Image from "next/image";
import { posterUrl, type PosterSize } from "./poster";

export default function PosterImage({
  posterPath,
  title,
  size = "w92",
  width,
  height,
  className,
}: {
  posterPath: string | null;
  title: string;
  size?: PosterSize;
  width: number;
  height: number;
  className?: string;
}) {
  const url = posterUrl(posterPath, size);
  if (!url) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          display: "grid",
          placeItems: "center",
          background: "var(--panel-tint)",
          color: "var(--text-dim)",
          fontWeight: 600,
          borderRadius: "8px",
          fontSize: width >= 120 ? "1.4rem" : "1rem",
        }}
        aria-label={`No poster for ${title}`}
      >
        🌿{title.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      className={className}
      src={url}
      alt={`${title} poster`}
      width={width}
      height={height}
      style={{ borderRadius: "8px", objectFit: "cover" }}
      unoptimized={false}
    />
  );
}
```

## Task 10: TmdbCombobox styles

**Files:**
- Create: `app/movies/TmdbCombobox.module.css`

- [ ] **Step 1: Create the file**

```css
.wrap {
  position: relative;
}

.input {
  /* inherits global input styles */
}

.spinner {
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border: 2px solid rgba(31, 45, 28, 0.18);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
  pointer-events: none;
}

@keyframes spin {
  to { transform: translateY(-50%) rotate(360deg); }
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 20;
  background: var(--panel);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  max-height: 22rem;
  overflow-y: auto;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  font-size: 0.92rem;
  border-radius: var(--radius-sm);
}
.row.highlight { background: var(--panel-tint); }

.thumb {
  flex-shrink: 0;
  width: 32px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--panel-tint);
  display: grid;
  place-items: center;
  color: var(--text-dim);
  font-size: 0.9rem;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.title {
  color: var(--text);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.year {
  color: var(--text-dim);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}

.manual {
  font-style: italic;
  color: var(--text-dim);
  border-top: 1px solid var(--border);
  margin: 0.25rem 0 0;
  padding-top: 0.55rem;
}

.empty, .error {
  padding: 0.55rem 0.7rem;
  color: var(--text-dim);
  font-size: 0.9rem;
}
.error { color: var(--danger); }
```

## Task 11: TmdbCombobox component

**Files:**
- Create: `app/movies/TmdbCombobox.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { searchMovies, type TmdbResult } from "./tmdb";
import { posterUrl } from "./poster";
import styles from "./TmdbCombobox.module.css";

type Props = {
  value: string;
  onTextChange: (text: string) => void;
  onSelect: (result: TmdbResult) => void;
  autoFocus?: boolean;
};

export default function TmdbCombobox({
  value,
  onTextChange,
  onSelect,
  autoFocus,
}: Props) {
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced fetch on value change.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setErrorMsg(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const res = await searchMovies(q);
      setLoading(false);
      if (res.error) {
        setErrorMsg(res.error);
        setResults([]);
      } else {
        setErrorMsg(null);
        setResults(res.results);
      }
      setHighlight(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const showManualRow = results.length > 0;
  const lastIndex = showManualRow ? results.length : results.length - 1;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, lastIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (results.length === 0) return;
      e.preventDefault();
      if (highlight < results.length) {
        onSelect(results[highlight]);
      }
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const dropdownVisible = open && value.trim().length >= 2;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => {
          onTextChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        autoComplete="off"
        required
        maxLength={200}
        role="combobox"
        aria-expanded={dropdownVisible}
        aria-autocomplete="list"
      />
      {loading && <span className={styles.spinner} aria-hidden="true" />}

      {dropdownVisible && (
        <ul className={styles.dropdown} role="listbox">
          {errorMsg && <li className={styles.error}>{errorMsg}</li>}
          {!loading && !errorMsg && results.length === 0 && (
            <li className={styles.empty}>No suggestions</li>
          )}
          {results.map((r, i) => {
            const url = posterUrl(r.poster_path, "w92");
            return (
              <li
                key={r.tmdb_id}
                role="option"
                aria-selected={i === highlight}
                className={`${styles.row} ${i === highlight ? styles.highlight : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(r);
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlight(i)}
              >
                <span className={styles.thumb}>
                  {url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={url} alt="" />
                  ) : (
                    "🎬"
                  )}
                </span>
                <span className={styles.info}>
                  <span className={styles.title}>{r.title}</span>
                  {r.year !== null && <span className={styles.year}>{r.year}</span>}
                </span>
              </li>
            );
          })}
          {showManualRow && (
            <li
              role="option"
              aria-selected={highlight === results.length}
              className={`${styles.row} ${styles.manual} ${
                highlight === results.length ? styles.highlight : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              onMouseEnter={() => setHighlight(results.length)}
            >
              Use &ldquo;{value}&rdquo; without TMDB match
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
```

(The plain `<img>` is intentional inside the dropdown thumbnails — `next/image` requires fixed `width`/`height` and would over-eagerly preload off-screen suggestion images. The `eslint-disable-next-line` keeps lint clean.)

## Task 12: Wire combobox into MovieForm

**Files:**
- Modify: `app/movies/MovieForm.tsx`

- [ ] **Step 1: Replace the entire file contents**

```tsx
"use client";

import { useState, useTransition } from "react";
import type { Movie, MovieInput } from "./types";
import type { TmdbResult } from "./tmdb";
import { createMovie, updateMovie } from "./actions";
import TmdbCombobox from "./TmdbCombobox";
import styles from "./MovieForm.module.css";

type Props =
  | { mode: "create"; onClose: () => void; initial?: undefined }
  | { mode: "edit"; onClose: () => void; initial: Movie };

export default function MovieForm({ mode, onClose, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [rating, setRating] = useState<number>(initial?.rating ?? 4);
  const [watchedOn, setWatchedOn] = useState(initial?.watched_on ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tmdbId, setTmdbId] = useState<number | null>(initial?.tmdb_id ?? null);
  const [posterPath, setPosterPath] = useState<string | null>(
    initial?.poster_path ?? null,
  );
  const [overview, setOverview] = useState<string | null>(initial?.overview ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Any manual title edit drops the linked TMDB metadata, since the title
  // and metadata would otherwise drift apart.
  function handleTextChange(text: string) {
    setTitle(text);
    if (tmdbId !== null) {
      setTmdbId(null);
      setPosterPath(null);
      setOverview(null);
    }
  }

  function handleTmdbSelect(r: TmdbResult) {
    setTitle(r.title);
    setYear(r.year !== null ? r.year.toString() : "");
    setTmdbId(r.tmdb_id);
    setPosterPath(r.poster_path);
    setOverview(r.overview);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 200) {
      setError("Title must be 1–200 characters.");
      return;
    }
    const yearNum = year.trim() === "" ? null : Number(year);
    if (yearNum !== null && (!Number.isInteger(yearNum) || yearNum < 1888)) {
      setError("Year must be a whole number ≥ 1888 (or blank).");
      return;
    }
    if (notes.length > 2000) {
      setError("Notes must be 2000 characters or fewer.");
      return;
    }

    const input: MovieInput = {
      title: trimmedTitle,
      year: yearNum,
      rating,
      notes: notes.trim() === "" ? null : notes,
      watched_on: watchedOn === "" ? null : watchedOn,
      tmdb_id: tmdbId,
      poster_path: posterPath,
      overview,
    };

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createMovie(input)
          : await updateMovie(initial.id, input);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h2 className={styles.title}>
        {mode === "create" ? "Add movie" : "Edit movie"}
      </h2>

      {error && <div className="error">{error}</div>}

      <label className={styles.field}>
        <span>Title <em>required</em></span>
        <TmdbCombobox
          value={title}
          onTextChange={handleTextChange}
          onSelect={handleTmdbSelect}
          autoFocus
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Year</span>
          <input
            type="number"
            inputMode="numeric"
            min={1888}
            max={new Date().getFullYear() + 5}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2024"
          />
        </label>

        <label className={styles.field}>
          <span>Watched on</span>
          <input
            type="date"
            value={watchedOn}
            onChange={(e) => setWatchedOn(e.target.value)}
          />
        </label>
      </div>

      <fieldset className={styles.ratingField}>
        <legend>Rating <em>required</em></legend>
        <div className={styles.starPicker} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              className={`${styles.starBtn} ${n <= rating ? styles.starOn : ""}`}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
          <span className={styles.ratingLabel}>{rating} / 5</span>
        </div>
      </fieldset>

      <label className={styles.field}>
        <span>Notes</span>
        <textarea
          maxLength={2000}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you think?"
        />
      </label>

      <div className={styles.actions}>
        <button type="button" onClick={onClose} disabled={isPending}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={isPending}>
          {isPending
            ? mode === "create" ? "Adding…" : "Saving…"
            : mode === "create" ? "Add movie" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
```

## Task 13: Phase 2 verification + commit

- [ ] **Step 1: Lint + build**

```bash
cd Exercise5
npm run lint
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
  TMDB_API_KEY="placeholder" \
  npm run build
```

Expected: lint clean, build succeeds.

- [ ] **Step 2: Manual smoke test in the browser**

`npm run dev` → http://localhost:3000/movies → click **+ Add movie** → in the title field type `dune` → wait ~300ms → confirm a dropdown appears with poster thumbnails. Click "Dune: Part Two" → confirm the title and year fields are filled. Set rating, save. The new row appears in the list (with no poster yet — Phase 3 adds that).

- [ ] **Step 3: Commit**

```bash
git add Exercise5/app/movies/PosterImage.tsx \
        Exercise5/app/movies/TmdbCombobox.tsx \
        Exercise5/app/movies/TmdbCombobox.module.css \
        Exercise5/app/movies/MovieForm.tsx
git commit -m "Exercise5: TMDB combobox in MovieForm

Type-ahead dropdown with debounced /search/movie calls. Selecting a
result fills title + year and stashes tmdb_id/poster_path/overview;
manual edits to the title clear the linked metadata. Adds a shared
PosterImage component (used in Phase 3 for list/grid).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Phase 3 — List + grid views with posters

## Task 14: ViewToggle component

**Files:**
- Create: `app/movies/ViewToggle.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

export type ViewMode = "list" | "grid";

export default function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  return (
    <div role="group" aria-label="View mode" style={{ display: "flex", gap: 0 }}>
      <button
        type="button"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={value === "list" ? "primary" : ""}
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        📋 List
      </button>
      <button
        type="button"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        className={value === "grid" ? "primary" : ""}
        style={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          marginLeft: -1,
        }}
      >
        ▦ Grid
      </button>
    </div>
  );
}
```

## Task 15: MovieList CSS additions

**Files:**
- Modify: `app/movies/MovieList.module.css`

- [ ] **Step 1: Add new selectors at the end of the file**

Append (after the existing `.emptyCard` blocks):

```css
.thumbInRow {
  flex-shrink: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 0;
  list-style: none;
  margin: 0;
}

@media (max-width: 720px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .grid { grid-template-columns: 1fr; }
}

.card {
  position: relative;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px -10px rgba(31, 45, 28, 0.32);
}

.cardPoster {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: var(--panel-tint);
}
.cardPoster img,
.cardPoster > div {
  width: 100% !important;
  height: 100% !important;
  border-radius: 0 !important;
}

.cardRating {
  position: absolute;
  right: 0.4rem;
  bottom: 0.4rem;
  background: rgba(31, 45, 28, 0.78);
  color: #fcd34d;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.cardBody {
  padding: 0.65rem 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.cardTitle {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cardYear {
  color: var(--text-dim);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}

.cardDelete {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  background: rgba(255, 255, 255, 0.92);
  color: var(--danger);
  border: 1px solid rgba(230, 57, 70, 0.35);
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-size: 0.95rem;
  line-height: 1;
  padding: 0;
  display: grid;
  place-items: center;
  opacity: 0;
  transition: opacity 120ms ease;
}
.card:hover .cardDelete,
.card:focus-within .cardDelete { opacity: 1; }
.cardDelete:hover { background: #ffe4e6; }
```

## Task 16: MovieList wiring

**Files:**
- Modify: `app/movies/MovieList.tsx`

- [ ] **Step 1: Replace the entire file contents**

```tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Movie } from "./types";
import { deleteMovie } from "./actions";
import MovieForm from "./MovieForm";
import PosterImage from "./PosterImage";
import ViewToggle, { type ViewMode } from "./ViewToggle";
import styles from "./MovieList.module.css";

type SortKey = "watched_desc" | "rating_desc" | "title_asc";

const VIEW_KEY = "movie-tracker.viewMode";

export default function MovieList({ initialMovies }: { initialMovies: Movie[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("watched_desc");
  const [minRating, setMinRating] = useState<number>(0);
  const [view, setView] = useState<ViewMode>("list");

  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Hydrate view mode from localStorage on first client render.
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(VIEW_KEY);
      if (v === "list" || v === "grid") setView(v);
    } catch {
      // localStorage not available — fall back to default.
    }
  }, []);

  function setViewMode(next: ViewMode) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // ignore
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = initialMovies;
    if (q) list = list.filter((m) => m.title.toLowerCase().includes(q));
    if (minRating > 0) list = list.filter((m) => m.rating >= minRating);
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "rating_desc") return b.rating - a.rating;
      if (sort === "title_asc") return a.title.localeCompare(b.title);
      const aw = a.watched_on ?? "";
      const bw = b.watched_on ?? "";
      if (aw === bw) return b.created_at.localeCompare(a.created_at);
      if (!aw) return 1;
      if (!bw) return -1;
      return bw.localeCompare(aw);
    });
    return sorted;
  }, [initialMovies, search, sort, minRating]);

  function handleDelete(movie: Movie) {
    if (!confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;
    setError(null);
    setPendingId(movie.id);
    startTransition(async () => {
      const res = await deleteMovie(movie.id);
      setPendingId(null);
      if (res.error) setError(res.error);
    });
  }

  if (isAdding) {
    return <MovieForm mode="create" onClose={() => setIsAdding(false)} />;
  }
  if (editing) {
    return (
      <MovieForm
        mode="edit"
        initial={editing}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.toolbar}>
        <button className="primary" onClick={() => setIsAdding(true)}>
          + Add movie
        </button>

        <div className={styles.controls}>
          <input
            type="search"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="watched_desc">Sort: Date watched ↓</option>
            <option value="rating_desc">Sort: Rating ↓</option>
            <option value="title_asc">Sort: Title A→Z</option>
          </select>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            aria-label="Minimum rating"
          >
            <option value={0}>Min ★: Any</option>
            <option value={1}>Min ★: 1</option>
            <option value={2}>Min ★: 2</option>
            <option value={3}>Min ★: 3</option>
            <option value={4}>Min ★: 4</option>
            <option value={5}>Min ★: 5</option>
          </select>
          <ViewToggle value={view} onChange={setViewMode} />
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {initialMovies.length === 0 ? (
        <EmptyState onAdd={() => setIsAdding(true)} />
      ) : visible.length === 0 ? (
        <p className={styles.empty}>No movies match your filters.</p>
      ) : view === "grid" ? (
        <ul className={styles.grid}>
          {visible.map((m) => (
            <li
              key={m.id}
              className={styles.card}
              onClick={() => setEditing(m)}
            >
              <div className={styles.cardPoster}>
                <PosterImage
                  posterPath={m.poster_path}
                  title={m.title}
                  size="w342"
                  width={342}
                  height={513}
                />
                <span className={styles.cardRating}>
                  {"★".repeat(m.rating)}
                </span>
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{m.title}</span>
                {m.year !== null && (
                  <span className={styles.cardYear}>{m.year}</span>
                )}
              </div>
              <button
                type="button"
                className={styles.cardDelete}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(m);
                }}
                disabled={pendingId === m.id}
                aria-label={`Delete ${m.title}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.list}>
          {visible.map((m) => (
            <li key={m.id} className={styles.row}>
              <div className={styles.thumbInRow}>
                <PosterImage
                  posterPath={m.poster_path}
                  title={m.title}
                  size="w92"
                  width={60}
                  height={90}
                />
              </div>
              <div className={styles.rowMain}>
                <div className={styles.rowHeader}>
                  <Stars value={m.rating} />
                  <strong className={styles.rowTitle}>{m.title}</strong>
                  {m.year !== null && <span className={styles.year}>({m.year})</span>}
                  {m.watched_on && <span className={styles.date}>{m.watched_on}</span>}
                </div>
                {m.notes && <p className={styles.notes}>“{m.notes}”</p>}
              </div>
              <div className={styles.rowActions}>
                <button onClick={() => setEditing(m)} disabled={pendingId === m.id}>
                  Edit
                </button>
                <button
                  className="danger"
                  onClick={() => handleDelete(m)}
                  disabled={pendingId === m.id}
                >
                  {pendingId === m.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className={styles.emptyCard}>
      <h2>No movies yet</h2>
      <p>Log the first movie you&apos;ve watched to get started.</p>
      <button className="primary" onClick={onAdd}>
        + Add your first movie
      </button>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-label={`${value} of 5 stars`}>
      {"★".repeat(value)}
      <span className={styles.starsDim}>{"★".repeat(5 - value)}</span>
    </span>
  );
}
```

## Task 17: Phase 3 verification + commit

- [ ] **Step 1: Lint + build**

```bash
cd Exercise5
npm run lint
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
  TMDB_API_KEY="placeholder" \
  npm run build
```

Expected: lint clean, build succeeds.

- [ ] **Step 2: Manual smoke test**

`npm run dev` → http://localhost:3000/movies. The list now shows posters where TMDB matched (or sage placeholders). Click ▦ Grid → grid view with poster cards renders. Reload page → grid view persists. Click 📋 List → reload → list view persists. Resize browser to ~600px wide → grid drops to 2 columns. ~400px → 1 column.

- [ ] **Step 3: Commit**

```bash
git add Exercise5/app/movies/ViewToggle.tsx \
        Exercise5/app/movies/MovieList.tsx \
        Exercise5/app/movies/MovieList.module.css
git commit -m "Exercise5: list/grid view toggle with posters

ViewToggle component drives a parallel grid render path in MovieList.
View mode persists via localStorage. List rows gain a 60x90 thumbnail
column; grid uses 2:3 poster cards with a rating overlay and
hover-revealed delete button. Movies without TMDB matches show a sage
placeholder via PosterImage.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Phase 4 — Docs + end-to-end verification

## Task 18: README updates

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a new "TMDB integration" subsection under Setup**

Insert *between* the existing **3. Run the schema** and **4. Disable email confirmation** sections (renumbering follows naturally):

```markdown
### 3a. Apply the TMDB migration (existing projects only)

If you set up the project before TMDB integration was added, paste the contents of [`supabase/migrations/2026-04-30-tmdb.sql`](./supabase/migrations/2026-04-30-tmdb.sql) into the Supabase SQL Editor and run it. Fresh projects from `schema.sql` already have the new columns.

### 3b. Get a TMDB API key

1. Sign up at https://www.themoviedb.org/signup
2. **Settings → API** → request a Developer key (free, instant for personal use)
3. Copy the **API Read Access Token** (the long JWT-style v4 token, starts with `eyJ`)
4. Add it to `.env.local`:

   ```
   TMDB_API_KEY=<paste-token-here>
   ```

If you only have a v3 short-string key, the search action's `Authorization: Bearer …` line in [`app/movies/tmdb.ts`](./app/movies/tmdb.ts) needs to change to a `?api_key=…` query parameter instead.
```

- [ ] **Step 2: Add TMDB-related entries to the "Project layout" table**

In the existing project layout table, add these rows (alphabetised by path):

```markdown
| `app/movies/PosterImage.tsx`                 | `next/image` wrapper with sage placeholder fallback     |
| `app/movies/TmdbCombobox.tsx`                | Type-ahead dropdown for the title field                 |
| `app/movies/ViewToggle.tsx`                  | List/grid toggle                                        |
| `app/movies/poster.ts`                       | Build TMDB image CDN URLs                               |
| `app/movies/tmdb.ts`                         | Server Action — search TMDB                             |
| `supabase/migrations/2026-04-30-tmdb.sql`    | Adds `tmdb_id`/`poster_path`/`overview` columns         |
```

- [ ] **Step 3: Append TMDB checks to the verification list**

After the existing 10 verification steps, add:

```markdown
### TMDB verification

11. **Type-ahead:** add a movie, type "Dune" — within ~500ms a dropdown shows ≥ 2 results with thumbnails. Click "Dune: Part Two" → title and year fill. Save → row appears in list with a real poster.
12. **Manual entry:** type "asdfqwer" → dropdown shows "No suggestions" or only the manual fallback row → save → row stores with sage placeholder.
13. **Bad key:** set `TMDB_API_KEY=invalid` and restart dev server → typing in the title field shows "TMDB key not configured" inline; manual entry still works.
14. **View toggle:** click ▦ Grid → poster cards. Reload → grid persists. Resize 1024 → 600 → 400 → columns go 3 → 2 → 1.
15. **Mismatch protection:** select a TMDB result, then type extra characters in the title → metadata clears (verify by saving and looking at the row — no poster).
```

## Task 19: Spec mark-as-implemented (optional)

**Files:**
- Modify: `Exercise5/docs/superpowers/specs/2026-04-30-tmdb-integration-design.md`

- [ ] **Step 1: Add a "Status" line to the top of the spec**

Insert directly after the `# TMDB Integration — Design Spec` heading:

```markdown
**Status:** Implemented 2026-04-30. Plan: [`../plans/2026-04-30-tmdb-integration.md`](../plans/2026-04-30-tmdb-integration.md).
```

## Task 20: Final end-to-end verification

- [ ] **Step 1: Lint + build**

```bash
cd Exercise5
npm run lint
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
  TMDB_API_KEY="placeholder" \
  npm run build
```

Expected: lint clean; build succeeds; `/movies` is dynamic (`ƒ`); no new warnings about images.

- [ ] **Step 2: Run the full Verification section from the spec**

Walk through verification steps 1–15 in the spec's Verification section in a real browser against the dev server with the real `TMDB_API_KEY`. Note any failures.

- [ ] **Step 3: Commit**

```bash
git add Exercise5/README.md \
        Exercise5/docs/superpowers/specs/2026-04-30-tmdb-integration-design.md
git commit -m "Exercise5: README + spec status for TMDB integration

Documents the TMDB key + migration setup steps and adds five
end-to-end verification checks for the new feature. Marks the design
spec as Implemented.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Done criteria

- [ ] Schema migration applied to the live Supabase project; pre-migration rows display with placeholder.
- [ ] Type-ahead dropdown returns matches within ~500ms and selecting one fills title + year.
- [ ] Manual entries (no TMDB match) save successfully with sage placeholder posters.
- [ ] List view shows 60×90 thumbnails next to each row.
- [ ] Grid view shows 2:3 poster cards with rating overlay; columns adapt 3 / 2 / 1 across breakpoints.
- [ ] View choice persists across reloads.
- [ ] `npm run lint` clean; `npm run build` succeeds.
- [ ] Four commits land in order: backend, combobox, list/grid, docs.
