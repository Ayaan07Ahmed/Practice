# TMDB Integration — Design Spec

## Context

Exercise5 (movie tracker, Next.js 16 + Supabase) shipped with the v1 features specified in `2026-04-30-movie-tracker-design.md`: auth, CRUD, search/sort/filter, RLS-protected `movies` table. The "out of scope" list flagged TMDB poster lookup as a v2 enhancement, and the user has chosen it as the next iteration.

**Outcome:** when adding a movie, the user gets type-ahead suggestions from The Movie Database (TMDB) — selecting a result autofills title, year, and stashes a poster path + tmdb_id + overview. The `/movies` page gains a list/grid view toggle so posters can be displayed at thumbnail or card size, with the user's choice persisted across sessions.

The work stays inside the existing Exercise5 codebase. No new tables; an `ALTER TABLE` migration adds three columns. Manual entry continues to work end-to-end for movies that don't match TMDB results.

---

## Summary

- **Server Action `searchMovies(query)`** in `app/movies/tmdb.ts` calls TMDB `/search/movie` with the API key, returns the top ~6 simplified matches.
- **`TmdbCombobox`** client component replaces the plain title input in `MovieForm` — debounced, keyboard-navigable dropdown of poster + title + year.
- **Three new nullable columns** on `movies`: `tmdb_id int`, `poster_path text`, `overview text`.
- **List/grid view toggle** in `MovieList`, persisted in `localStorage`. List adds a 60px thumbnail; grid renders poster cards.
- **Sage-green placeholder** for movies without a poster (manual or pre-existing rows).
- **API key (`TMDB_API_KEY`)** stays server-side — no `NEXT_PUBLIC_` prefix.

---

## Architecture

**New files**

```
Exercise5/
  app/movies/
    tmdb.ts                # 'use server' — searchMovies(query): TmdbResult[]
    poster.ts              # pure util — posterUrl(path, size)
    TmdbCombobox.tsx       # client — title input + dropdown
    TmdbCombobox.module.css
    ViewToggle.tsx         # client — list/grid toggle
  supabase/migrations/
    2026-04-30-tmdb.sql    # ALTER TABLE
```

**Modified files**

- `app/movies/types.ts` — add `tmdb_id`, `poster_path`, `overview` (all nullable) to `Movie` and `MovieInput`
- `app/movies/MovieForm.tsx` — swap title `<input>` for `<TmdbCombobox>`; carry the three new fields in component state; pass them through to actions
- `app/movies/MovieList.tsx` — add view-mode state (default `list`, hydrated from `localStorage`); branch render between list and grid; mount `<ViewToggle>` in the toolbar
- `app/movies/MovieList.module.css` — add `.grid`, `.card`, `.cardPoster`, `.cardRating`, `.posterPlaceholder`, `.thumbInRow` styles
- `app/movies/actions.ts` — accept the new fields, validate, persist
- `.env.local.example` — add `TMDB_API_KEY=` line
- `README.md` — TMDB key setup section + run-the-migration note

**Why this shape**

- `tmdb.ts` is a Server Action so the API key never reaches the browser. The client receives only mapped result objects.
- `TmdbCombobox` keeps the dropdown logic isolated — `MovieForm`'s state stays focused on the form fields.
- `poster.ts` is a tiny pure util so list and grid views share the URL construction without coupling.
- View mode is local to `MovieList` — no global context — and persistence uses `localStorage` to keep the server simple.
- Migration is a separate file, additive only, so existing rows survive untouched.

---

## Data flow

### Schema migration

```sql
-- supabase/migrations/2026-04-30-tmdb.sql
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

No backfill. Existing rows keep `null` in the new columns; the placeholder UI handles that case.

### Search flow

```
type "dune" → debounce 300ms → invoke searchMovies("dune") (Server Action)
  → server: AbortController(5s) + fetch
            GET https://api.themoviedb.org/3/search/movie
                ?query=dune&include_adult=false&language=en-US&page=1
            Authorization: Bearer ${TMDB_API_KEY}
  → server: map .results[0..5] →
            { tmdb_id, title, year, poster_path, overview }
  → client: render dropdown
```

**Failure modes**
- Missing key → return `{ error: "TMDB key not configured" }`. Dropdown shows a small inline notice; manual entry still works.
- Network timeout / 4xx / 5xx → return `[]`. Dropdown shows "No suggestions".
- Query length < 2 → short-circuit to `[]` without making the call.
- TMDB rate-limit 429 → treat as `[]` for v2 (we'll only generate ~3–5 req/sec at most; not expected to hit limits).

### Save flow

Server Actions (`createMovie`, `updateMovie`) accept the three new fields. Validation rules:
- `tmdb_id`: integer or null
- `poster_path`: null OR matches `^/[A-Za-z0-9_./-]+$`, ≤ 200 chars
- `overview`: null OR ≤ 4000 chars

RLS policies unchanged — `auth.uid() = user_id` on all four operations.

### Poster URL construction

```ts
// app/movies/poster.ts
export function posterUrl(path: string | null, size: "w92" | "w342" = "w92") {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}/${path.replace(/^\//, "")}`;
}
```

`w92` for list thumbnails, `w342` for grid cards. TMDB image URLs are public.

### View-mode persistence

`MovieList` keeps `viewMode: "list" | "grid"` in `useState("list")`. A `useEffect` on mount reads `localStorage["movie-tracker.viewMode"]` and hydrates state. The `<ViewToggle>` writes the new value to `localStorage` on change. SSR renders the default `list`, then hydration swaps in the user's preference — a single layout shift on first load is acceptable.

---

## UI

**Combobox**: text input + dropdown (max ~6 rows). Each row: 32×48 thumbnail, title, year, one-line overview clipped. Keyboard: ↑/↓ navigates, Enter selects, Esc closes. A loading spinner replaces the clear button while fetching. The dropdown's last row is always "Use *<query>* without TMDB match" to allow manual entry.

**List view**: existing row layout, with a 60×90 poster (rounded 8px) prepended. Manual/pre-existing rows show a sage-green placeholder containing a 🌿 emoji and the title's first letter.

**Grid view**: responsive CSS grid — 3 cols ≥ 720px, 2 cols 480–720px, 1 col < 480px. Card structure: full-width poster on top, gold star overlay in poster's bottom-right, title + year below. Hover surfaces a small ✕ delete affordance in the top-right; clicking the card body opens the edit form.

**View toggle**: two icon buttons (📋 / ▦) appended to the toolbar, one shown active with the green accent background.

---

## Out of scope (v2)

- Surfacing the TMDB overview text in the UI (still stored, just not rendered yet)
- Poster zoom / lightbox
- Drag-to-reorder in grid view
- Refreshing TMDB metadata for previously saved movies
- Multi-language overviews
- TV show search (TMDB also has `/search/tv` — not exposed)
- Caching TMDB responses (the dropdown is fast enough without it)

---

## Verification

1. **Migration:** paste `2026-04-30-tmdb.sql` into Supabase SQL Editor → Run. In Table Editor, confirm `movies` now has `tmdb_id`, `poster_path`, `overview` columns.
2. **Existing rows:** open `/movies` — pre-migration entries render with the sage placeholder, no errors.
3. **Combobox happy path:** in the add form, type "Dune" → dropdown shows ≥ 2 results within ~500ms → click "Dune: Part Two" → title and year fill in → save → row appears in the list with the actual poster.
4. **Manual entry still works:** type a fake title like "asdfqwer" → dropdown shows "No suggestions" then the "Use 'asdfqwer' without TMDB match" row → click it (or just hit save) → row saves with `null` poster.
5. **Keyboard navigation:** type "dune" → press ↓ ↓ Enter → second result is selected.
6. **Bad key:** temporarily set `TMDB_API_KEY=invalid` → restart dev server → typing shows the inline error notice; manual entry still works.
7. **List/grid toggle:** click ▦ → grid view renders → reload page → grid view persists. Switch back to list → reload → list view persists.
8. **Responsive grid:** in DevTools, resize from 1024px → 600px → 400px and confirm column count changes 3 → 2 → 1.
9. **RLS still holds:** in a private window with a different user, type a query that should match a movie added by user A — confirm only your own movies appear in the list (the TMDB suggestions are public; the *saved* list is per-user).
10. **Lint + build:** `npm run lint` clean; `npm run build` succeeds.
