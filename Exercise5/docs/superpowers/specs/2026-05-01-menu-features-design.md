# Menu Features — Design Spec

## Context

Exercise5 currently has a single authenticated page (`/movies`) and a top nav bar. The user wants a left-side menu (with mobile hamburger) and five new menu items behind it: Watchlist, Trending, Discover, Stats, Profile. This spec covers the sidebar shell plus all five features as a single cohesive iteration.

**Outcome:** the app grows from a one-page tracker into a small multi-page app that resembles a real movie product (browse trending, browse by genre, see your stats, manage your account, plan what you'll watch next). Existing behavior — adding/editing/viewing watched movies — is preserved.

The work introduces one schema change (`status` column on `movies`), three new TMDB Server Actions (trending, discover-by-genre, genres list), six new pages, and shared poster-grid + nav components. No new tables.

---

## Summary

- **Sidebar (Phase 0):** left-fixed on desktop (220px), drawer on mobile via hamburger. Branding, 5 nav items, user card, sign-out.
- **Watchlist (Phase 1):** new `status` column (`watched` | `watchlist`). All existing rows get `watched`. New `/watchlist` page; one-click "Mark as watched" flow. The add-movie form gains a status selector.
- **Trending (Phase 2):** `/trending` shows TMDB trending-this-week as a poster grid; each card has "Add to Watchlist" / "Add as Watched" buttons.
- **Discover (Phase 3):** `/discover` lists TMDB genres; clicking a genre shows discover-movie results in the same poster grid.
- **Stats (Phase 4):** `/stats` aggregates the user's watched library — count, avg rating, ratings histogram, movies-per-year, top 5 by rating.
- **Profile (Phase 5):** `/profile` lets the user edit `display_name`, shows joined-on date and total movies tracked.

---

## Architecture

**Route group**

Introduce `app/(authenticated)/` route group so all six post-login pages share one layout:

```
app/
  (authenticated)/
    layout.tsx               # wraps children with <Sidebar/>; redirects to /login if no session
    movies/page.tsx          # moved from app/movies/
    watchlist/page.tsx       # NEW
    trending/page.tsx        # NEW
    discover/page.tsx        # NEW
    discover/[genreId]/page.tsx  # NEW
    stats/page.tsx           # NEW
    profile/page.tsx         # NEW
```

`/login`, `/signup`, `/auth/callback`, `/auth/signout` stay at `app/` root (no sidebar).

**New components**

```
app/components/
  Sidebar.tsx                # client — desktop fixed left, mobile drawer
  Sidebar.module.css
  PosterGrid.tsx             # client — grid of TMDB results with Add buttons
  PosterGrid.module.css
  StatsBars.tsx              # tiny client component for CSS-bar charts
```

**Modified files**

- `app/movies/MovieForm.tsx` — add status selector (Watched / Want to watch).
- `app/movies/MovieList.tsx` — filter by `status='watched'` (server-side via the page query already, no client change needed).
- `app/movies/types.ts` — add `status: "watched" | "watchlist"` and widen `rating` to `number | null` (rating is now optional for watchlist entries).
- `app/movies/actions.ts` — accept and persist `status`; add `markAsWatched(id, rating)` action.
- `app/movies/tmdb.ts` — add `getTrending()`, `getGenres()`, `discoverByGenre(genreId)` Server Actions; existing `searchMovies` stays.
- `app/movies/page.tsx` — moves into the route group; query filter to `status='watched'`.
- `supabase/schema.sql` — add `status` column with constraint and default.
- New migration `supabase/migrations/2026-05-01-watchlist.sql`.

**Why this shape**

- Route group keeps the sidebar in one layout file rather than duplicated per page.
- A single shared `<PosterGrid>` powers Trending + Discover since their UI is identical.
- TMDB calls stay server-side via Server Actions; the v4 token never reaches the client.
- Aggregation in Stats happens in Postgres (one round-trip with multiple SELECTs), not in JS.
- `status` as a column on the existing `movies` table — not a separate `watchlist` table — because the data shape is identical and migrating between states stays in one row.

---

## Data model changes

**Migration `2026-05-01-watchlist.sql`:**

```sql
alter table public.movies
  add column if not exists status text not null default 'watched'
    check (status in ('watched','watchlist'));

create index if not exists movies_user_status_idx
  on public.movies (user_id, status);
```

**Existing rows:** the `default 'watched'` clause means every pre-migration row gets `'watched'` automatically. No backfill needed.

**Watchlist semantics:**
- `status='watchlist'` rows: rating is allowed but typically not set; the existing CHECK `rating BETWEEN 1 AND 5` requires a value, so for v1 we set rating to `1` for watchlist entries (placeholder) OR — better — relax the constraint to `(status='watchlist' OR rating BETWEEN 1 AND 5)`. The migration takes the second path.
- `notes`, `watched_on` are optional for both states.

**Updated migration:**

```sql
alter table public.movies
  add column if not exists status text not null default 'watched'
    check (status in ('watched','watchlist'));

-- Drop old rating constraint, add status-aware version
alter table public.movies
  drop constraint if exists movies_rating_check;

alter table public.movies
  add constraint movies_rating_check
    check (
      (status = 'watchlist' and rating is null)
      or (status = 'watched' and rating between 1 and 5)
    );

-- Allow nullable rating for watchlist
alter table public.movies
  alter column rating drop not null;

create index if not exists movies_user_status_idx
  on public.movies (user_id, status);
```

`actions.ts` validation mirrors this: reject `rating != null` when `status='watchlist'`; require `rating` 1–5 when `status='watched'`.

---

## TMDB Server Actions (added to `app/movies/tmdb.ts`)

```ts
// existing: searchMovies(query)
export async function getTrending(): Promise<{ results: TmdbResult[]; error?: string }>
export async function getGenres(): Promise<{ genres: { id: number; name: string }[]; error?: string }>
export async function discoverByGenre(genreId: number, page?: number): Promise<{ results: TmdbResult[]; error?: string }>
```

Endpoints used:
- `GET /trending/movie/week` (no params)
- `GET /genre/movie/list?language=en-US`
- `GET /discover/movie?with_genres={id}&sort_by=popularity.desc&page={n}&language=en-US&include_adult=false`

All four use the same Bearer-token + 5s AbortController + degrade-to-empty pattern.

---

## UI per page

**`/watchlist`** — same layout as `/movies` (toolbar + list/grid). Toolbar adds a "← Watched movies" link. Each row gets a "Mark as watched" button that opens a small modal asking for rating, then calls `markAsWatched(id, rating)`. The modal can re-use `MovieForm` in a "fill rating" mode, or a tiny inline rating prompt — going with the inline prompt to keep it simple.

**`/trending`** — page heading "Trending this week", then a `<PosterGrid>` of 20 movies. Each card has poster, title, year, vote-average bubble (TMDB's score in /10), and two buttons: "+ Watchlist", "+ Watched". Clicking a button opens the `MovieForm` pre-filled (TMDB metadata stashed) with `status` pre-set, ready to save.

**`/discover`** — page heading "Browse by genre", then a 3–4-column grid of genre cards (label only, on a tinted panel). Each card links to `/discover/[genreId]`.

**`/discover/[genreId]`** — page heading "{Genre name}", a `<PosterGrid>` of `discoverByGenre(id).results`, same Add buttons as Trending.

**`/stats`** — heading "Your stats". Shows:
- Big numbers: total watched, average rating
- Ratings distribution: 5 horizontal bars (1★–5★) sized by count
- Movies per year: vertical bars (top ~10 years)
- Top 5 highest-rated (text list: gold stars + title + year)

All rendered server-side; only the bars are client-side via `<StatsBars>` for the CSS animation.

**`/profile`** — heading "Profile". Form with display-name input + Save button. Below: "Joined {date}", "{N} movies watched", "{M} on your watchlist". Sign-out button (already in sidebar; here also for convenience).

---

## Sidebar (Phase 0)

**Items, in order:**
1. 🎞️ Movies — `/movies`
2. ⭐ Watchlist — `/watchlist`
3. 🔥 Trending — `/trending`
4. 🎭 Discover — `/discover`
5. 📊 Stats — `/stats`
6. 👤 Profile — `/profile`

Plus user card (display name + email) and Sign Out at the bottom.

**Behavior:**
- Active item (matching current pathname) gets the iTunes-blue background.
- Hovering an inactive item gets a soft tinted hover.
- Mobile (<720px): sidebar slides in from left when hamburger tapped; backdrop dims the rest; tap outside closes; ESC also closes; resizing past 720px auto-closes.

---

## Out of scope

- Editing email or password
- Pagination on Trending / Discover (we show 20 results per page; stop there)
- TMDB caching (TMDB CDN is fast)
- Trending TV shows
- Year-in-review beyond the current Stats page
- Sharing watched lists with friends
- Importing from Letterboxd / IMDb

---

## Verification (manual)

After all phases complete, walk through:

1. **Sidebar renders** on every authenticated page. Items navigate correctly. Active state matches URL.
2. **Mobile drawer** opens via hamburger, closes on backdrop click, ESC, and viewport resize ≥ 720.
3. **Migration applied:** new `status` column visible in Supabase Table Editor; existing rows show `watched`.
4. **Add a movie as Watched:** behaves as before — appears in `/movies`.
5. **Add a movie as Watchlist:** does NOT appear in `/movies`; DOES appear in `/watchlist`. Rating field disabled in form.
6. **Mark from Watchlist as Watched:** prompts for rating; row disappears from `/watchlist`, appears in `/movies` with the new rating.
7. **Trending page:** loads 20 posters within 1s. "+ Watchlist" / "+ Watched" buttons pre-fill the form correctly.
8. **Discover landing:** shows ~19 genre cards. Clicking one navigates to `/discover/[genreId]` with results.
9. **Stats:** numbers match a manual count of watched rows. Ratings bars sum to total. Years bars include movies with non-null `watched_on`.
10. **Profile:** display name edit persists; joined date matches `auth.users.created_at`; counts match queries.
11. **Lint + build:** clean.
