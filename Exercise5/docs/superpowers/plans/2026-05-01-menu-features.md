# Menu Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow Exercise5 from a single-page movie tracker into a multi-page app with a left-side menu (mobile hamburger), a watchlist, TMDB trending, discover-by-genre, stats dashboard, and profile.

**Architecture:** Six phases, each landing as one commit. Phase 0 introduces a `(authenticated)` route group with a shared layout that renders the iTunes navbar and the new Sidebar; existing `/movies` files move into the group. Phase 1 adds a `status` column to `movies` and the watchlist page. Phases 2–3 add TMDB Server Actions and shared `<PosterGrid>` for trending + discover. Phase 4 aggregates Postgres for stats. Phase 5 lets the user edit their display name.

**Tech Stack:** Next.js 16 (App Router, route groups), React 19, TypeScript, Supabase Postgres + Auth, `@supabase/ssr`, CSS Modules, TMDB v3 search/trending/discover endpoints.

**Spec:** [`Exercise5/docs/superpowers/specs/2026-05-01-menu-features-design.md`](../specs/2026-05-01-menu-features-design.md)

**No automated tests** — same pattern as v1 and the TMDB integration. Each phase ends with `npm run lint` clean + a placeholder-env build, plus a manual smoke test the user runs after the migration is applied.

**Working dir:** `c:/Users/AyaanAhmed/Desktop/Practice/Exercise5/`

**Commit cadence:** one commit per phase (six commits total).

---

## File map

### New files
| Path | Phase | Purpose |
|------|-------|---------|
| `app/(authenticated)/layout.tsx` | 0 | Auth-gate + navbar + sidebar wrapper |
| `app/(authenticated)/layout.module.css` | 0 | Layout grid, navbar styles |
| `app/components/Sidebar.tsx` | 0 | Left panel + mobile drawer |
| `app/components/Sidebar.module.css` | 0 | Sidebar styles |
| `app/(authenticated)/watchlist/page.tsx` | 1 | Watchlist server component |
| `app/(authenticated)/watchlist/MarkWatchedButton.tsx` | 1 | Inline rating prompt + mark-as-watched action wrapper |
| `app/(authenticated)/watchlist/MarkWatchedButton.module.css` | 1 | |
| `supabase/migrations/2026-05-01-watchlist.sql` | 1 | Schema migration |
| `app/(authenticated)/trending/page.tsx` | 2 | Trending server component |
| `app/components/PosterGrid.tsx` | 2 | Shared TMDB poster grid (used by Trending + Discover) |
| `app/components/PosterGrid.module.css` | 2 | |
| `app/(authenticated)/discover/page.tsx` | 3 | Genre landing |
| `app/(authenticated)/discover/discover.module.css` | 3 | |
| `app/(authenticated)/discover/[genreId]/page.tsx` | 3 | Genre results |
| `app/(authenticated)/stats/page.tsx` | 4 | Stats server component |
| `app/(authenticated)/stats/stats.module.css` | 4 | |
| `app/components/StatsBars.tsx` | 4 | CSS-bar chart |
| `app/components/StatsBars.module.css` | 4 | |
| `app/(authenticated)/profile/page.tsx` | 5 | Profile form |
| `app/(authenticated)/profile/profile.module.css` | 5 | |
| `app/(authenticated)/profile/actions.ts` | 5 | `updateDisplayName` server action |

### Moved files (Phase 0)
The entire `app/movies/` folder (excluding the route's own `page.tsx` which is recreated as a thin wrapper) moves wholesale to `app/(authenticated)/movies/`. Internal relative imports continue to work; nothing else in the app imports from `app/movies`.

### Modified files
| Path | Phases | Change |
|------|--------|--------|
| `proxy.ts` | 0 | Gate /watchlist, /trending, /discover, /stats, /profile alongside /movies |
| `app/layout.tsx` | 0 | No change to logic; just confirms it's the root |
| `app/(authenticated)/movies/page.tsx` (was `app/movies/page.tsx`) | 0, 1, 2 | Move into route group; navbar moves out; filter by `status='watched'`; read URL params for pre-filled add |
| `app/(authenticated)/movies/MovieList.tsx` | 1, 2 | Accept `prefilledFromUrl` prop; pass `status` through |
| `app/(authenticated)/movies/MovieForm.tsx` | 1, 2 | Status selector; accept TMDB pre-fill; rating optional when watchlist |
| `app/(authenticated)/movies/types.ts` | 1 | Add `status`, widen `rating` to `number \| null` |
| `app/(authenticated)/movies/actions.ts` | 1 | Persist `status`; add `markAsWatched(id, rating)`; validation update |
| `app/(authenticated)/movies/tmdb.ts` | 2, 3 | Add `getTrending`, `getGenres`, `discoverByGenre` |
| `supabase/schema.sql` | 1 | Synchronise with migration |

---

# Phase 0 — Sidebar shell + route group

## Task 0.1: Create the (authenticated) route group layout

- [ ] **Step 1: Create `app/(authenticated)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/app/components/Sidebar";
import styles from "./layout.module.css";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName =
    typeof user.user_metadata?.display_name === "string" &&
    user.user_metadata.display_name.trim().length > 0
      ? user.user_metadata.display_name.trim()
      : user.email ?? "Account";

  return (
    <>
      <header className={styles.navBar}>
        <div className={styles.navBarInner}>
          <h1 className={styles.title}>🎬 Movie Tracker</h1>
        </div>
      </header>
      <Sidebar displayName={displayName} email={user.email} />
      <main className={styles.main}>{children}</main>
    </>
  );
}
```

- [ ] **Step 2: Create `app/(authenticated)/layout.module.css`**

```css
.navBar {
  position: relative;
  width: 100%;
  background: linear-gradient(180deg, var(--nav-bar-top) 0%, var(--nav-bar-bottom) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18),
    0 2px 4px rgba(0, 0, 0, 0.18);
  z-index: 30;
}

.navBarInner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0.75rem 1rem 0.75rem 3.25rem;
  display: flex;
  align-items: center;
}

.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--text-on-bar);
  text-shadow: var(--text-emboss-dark);
}

.main {
  min-height: calc(100vh - 48px);
}

@media (min-width: 720px) {
  .main {
    margin-left: 220px;
  }
  .navBarInner {
    padding-left: calc(220px + 1rem);
  }
}
```

The mobile padding-left: 3.25rem leaves room for the hamburger button which sits absolute over the navbar.

## Task 0.2: Create Sidebar component styles

- [ ] **Step 1: Create `app/components/Sidebar.module.css`**

```css
.hamburger {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 40;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  gap: 4px;
  padding: 0;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    var(--shadow-sm);
}
.hamburger span {
  display: block;
  width: 18px;
  height: 2px;
  background: #ffffff;
  border-radius: 1px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}

@media (min-width: 720px) {
  .hamburger { display: none; }
}

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 35;
}
@media (min-width: 720px) {
  .backdrop { display: none; }
}

.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 220px;
  z-index: 36;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.9rem 0.75rem 1rem;
  background: linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
  border-right: 1px solid var(--border-strong);
  box-shadow:
    inset -1px 0 0 rgba(255, 255, 255, 0.5),
    2px 0 8px rgba(0, 0, 0, 0.25);
  transform: translateX(-100%);
  transition: transform 220ms ease;
}
.sidebar.open { transform: translateX(0); }

@media (min-width: 720px) {
  .sidebar { transform: translateX(0); }
}

.brand {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding: 0.4rem 0.6rem 0.7rem;
  color: var(--text);
  text-shadow: var(--text-emboss-light);
  border-bottom: 1px solid var(--border);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0;
}

.link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.92rem;
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  text-shadow: var(--text-emboss-light);
}
.link:hover {
  background: var(--panel-tint);
  text-decoration: none;
}
.link.active {
  background: linear-gradient(180deg, var(--button-top) 0%, var(--button-bottom) 100%);
  color: var(--accent-fg);
  text-shadow: var(--text-emboss-dark);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    var(--shadow-sm);
}
.icon { font-size: 1.05em; line-height: 1; width: 1.2rem; text-align: center; }

.spacer { flex: 1 1 auto; }

.user {
  padding: 0.6rem 0.6rem 0.4rem;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
}
.userName {
  font-weight: 700;
  color: var(--text);
  text-shadow: var(--text-emboss-light);
}
.userEmail {
  color: var(--text-dim);
  font-size: 0.78rem;
  word-break: break-all;
  margin-top: 0.1rem;
}

.signoutForm { display: flex; }
.signout {
  width: 100%;
}
```

## Task 0.3: Create the Sidebar component

- [ ] **Step 1: Create `app/components/Sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { href: "/movies", label: "Movies", icon: "🎞️" },
  { href: "/watchlist", label: "Watchlist", icon: "⭐" },
  { href: "/trending", label: "Trending", icon: "🔥" },
  { href: "/discover", label: "Discover", icon: "🎭" },
  { href: "/stats", label: "Stats", icon: "📊" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

type Props = {
  displayName: string;
  email: string | undefined;
};

export default function Sidebar({ displayName, email }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Auto-close when widening past mobile breakpoint
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 720) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when open on mobile
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.hamburger}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div
          className={styles.backdrop}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.brand}>🎬 Movie Tracker</div>

        <nav className={styles.nav} aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${active ? styles.active : ""}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.spacer} />

        <div className={styles.user}>
          <div className={styles.userName}>{displayName}</div>
          {email && email !== displayName && (
            <div className={styles.userEmail}>{email}</div>
          )}
        </div>

        <form action="/auth/signout" method="post" className={styles.signoutForm}>
          <button type="submit" className={styles.signout}>
            Sign out
          </button>
        </form>
      </aside>
    </>
  );
}
```

## Task 0.4: Move app/movies → app/(authenticated)/movies

- [ ] **Step 1: Move the entire folder**

```bash
cd c:/Users/AyaanAhmed/Desktop/Practice/Exercise5/app
mkdir -p "(authenticated)"
mv movies "(authenticated)/movies"
```

(On Windows bash, the parens in `(authenticated)` need quoting. Verify after the move that `app/(authenticated)/movies/` contains: `MovieList.tsx`, `MovieForm.tsx`, `MovieView.tsx`, `MovieView.module.css`, `TmdbCombobox.tsx`, `TmdbCombobox.module.css`, `PosterImage.tsx`, `ViewToggle.tsx`, `actions.ts`, `tmdb.ts`, `types.ts`, `poster.ts`, `page.tsx`, `MovieList.module.css`, `MovieForm.module.css`, `page.module.css`.)

- [ ] **Step 2: Strip the navbar from the moved `page.tsx`**

The layout now provides the navbar. Replace `app/(authenticated)/movies/page.tsx` with:

```tsx
import { createClient } from "@/lib/supabase/server";
import MovieList from "./MovieList";
import type { Movie } from "./types";

export default async function MoviesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "watched")
    .order("watched_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      {error ? (
        <div className="error">Failed to load movies: {error.message}</div>
      ) : (
        <MovieList initialMovies={(data ?? []) as Movie[]} />
      )}
    </div>
  );
}
```

(`status='watched'` filter is added now even though Phase 1 hasn't migrated the DB yet — Phase 1 step 1 applies the migration. After migration, this query works; before migration the column doesn't exist and `/movies` will error. This is acceptable since Phase 0 ends with no functional change to /movies until Phase 1 migrates.)

Wait — `status='watched'` would error on a pre-migration DB. To keep Phase 0 deployable on its own, leave the filter out for now. We'll add `.eq("status", "watched")` in Phase 1 right before the migration is applied. Replace the file with:

```tsx
import { createClient } from "@/lib/supabase/server";
import MovieList from "./MovieList";
import type { Movie } from "./types";

export default async function MoviesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .order("watched_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      {error ? (
        <div className="error">Failed to load movies: {error.message}</div>
      ) : (
        <MovieList initialMovies={(data ?? []) as Movie[]} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Delete the now-redundant `page.module.css` from the moved folder**

```bash
rm c:/Users/AyaanAhmed/Desktop/Practice/Exercise5/app/(authenticated)/movies/page.module.css
```

(The navbar styles it held are now in the layout's css module. The `.wrap` styles are inlined in the page since they only apply once. If you prefer them in a module, that's fine — but step 2 inlines them.)

## Task 0.5: Update proxy.ts to gate the new authenticated routes

- [ ] **Step 1: Read the current `proxy.ts`**

It currently has `if (path.startsWith("/movies")) { ... gate ... }`.

- [ ] **Step 2: Update `lib/supabase/proxy.ts` so the authenticated set is a list**

Replace the `path.startsWith("/movies")` check with:

```ts
  const path = request.nextUrl.pathname;
  const isProtected =
    path === "/movies" ||
    path.startsWith("/movies/") ||
    path === "/watchlist" ||
    path.startsWith("/watchlist/") ||
    path === "/trending" ||
    path.startsWith("/trending/") ||
    path === "/discover" ||
    path.startsWith("/discover/") ||
    path === "/stats" ||
    path.startsWith("/stats/") ||
    path === "/profile" ||
    path.startsWith("/profile/");
  const isAuthRoute = path === "/login" || path === "/signup";
```

(`isAuthRoute` block stays as it was.)

## Task 0.6: Verify and commit

- [ ] **Step 1: Lint**

```bash
cd c:/Users/AyaanAhmed/Desktop/Practice/Exercise5
npm run lint
```

Expected: clean (no output).

- [ ] **Step 2: Build with placeholder env**

```bash
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
  TMDB_API_KEY="placeholder" \
  npm run build
```

Expected: success. Route table includes `/movies` (Dynamic).

- [ ] **Step 3: Commit**

```bash
cd c:/Users/AyaanAhmed/Desktop/Practice
git add -A Exercise5/app Exercise5/lib
git commit -m "$(cat <<'EOF'
Exercise5: phase 0 — sidebar shell + (authenticated) route group

Adds left-side navigation panel that's a fixed sidebar on desktop
(>=720px) and a hamburger drawer on mobile. New (authenticated) route
group hosts the iTunes navbar + sidebar in a shared layout; existing
movies feature moves into it. proxy.ts now gates the four upcoming
sibling routes (watchlist/trending/discover/stats/profile) alongside
/movies.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 1 — Watchlist

## Task 1.1: Schema migration

- [ ] **Step 1: Create `supabase/migrations/2026-05-01-watchlist.sql`**

```sql
alter table public.movies
  add column if not exists status text not null default 'watched'
    check (status in ('watched','watchlist'));

-- Replace rating constraint with status-aware version
alter table public.movies
  drop constraint if exists movies_rating_check;

alter table public.movies
  alter column rating drop not null;

alter table public.movies
  add constraint movies_rating_check
    check (
      (status = 'watchlist' and rating is null)
      or (status = 'watched' and rating between 1 and 5)
    );

create index if not exists movies_user_status_idx
  on public.movies (user_id, status);
```

- [ ] **Step 2: Apply via Supabase SQL Editor**

Manual (controller, not subagent): paste into Supabase dashboard → SQL Editor → Run. Verify in Table Editor that `movies` now has `status` column with default `'watched'`.

- [ ] **Step 3: Sync `supabase/schema.sql`**

Update the `create table` block — replace the rating line and add status:

```sql
  rating      int  null,
  ...
  status      text not null default 'watched'
              check (status in ('watched','watchlist')),
```

Replace the existing `check (rating between 1 and 5)` with the status-aware constraint at the table level (after all columns, like other multi-column checks):

```sql
  ...
  constraint movies_rating_check check (
    (status = 'watchlist' and rating is null)
    or (status = 'watched' and rating between 1 and 5)
  ),
```

Add the new index after the existing indexes:

```sql
create index if not exists movies_user_status_idx
  on public.movies (user_id, status);
```

## Task 1.2: Update types

- [ ] **Step 1: Replace `app/(authenticated)/movies/types.ts`**

```ts
export type Status = "watched" | "watchlist";

export type Movie = {
  id: string;
  user_id: string;
  title: string;
  year: number | null;
  rating: number | null;
  notes: string | null;
  watched_on: string | null;
  created_at: string;
  tmdb_id: number | null;
  poster_path: string | null;
  overview: string | null;
  status: Status;
};

export type MovieInput = {
  title: string;
  year: number | null;
  rating: number | null;
  notes: string | null;
  watched_on: string | null;
  tmdb_id: number | null;
  poster_path: string | null;
  overview: string | null;
  status: Status;
};
```

## Task 1.3: Update server actions

- [ ] **Step 1: Replace `validate` and `normalize` in `app/(authenticated)/movies/actions.ts`**

```ts
const POSTER_PATH_RE = /^\/[A-Za-z0-9_./-]+$/;
const VALID_STATUSES = new Set(["watched", "watchlist"]);

function validate(input: MovieInput): string | null {
  const title = input.title?.trim() ?? "";
  if (title.length < 1 || title.length > 200) return "Title must be 1–200 characters.";
  if (!VALID_STATUSES.has(input.status)) return "Invalid status.";
  if (input.status === "watched") {
    if (
      input.rating === null ||
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      return "Rating must be between 1 and 5 for watched movies.";
    }
  } else {
    if (input.rating !== null) return "Watchlist entries must not have a rating.";
  }
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
    status: input.status,
  };
}
```

- [ ] **Step 2: Add `markAsWatched` action at the bottom of `actions.ts`**

```ts
export async function markAsWatched(id: string, rating: number): Promise<ActionResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "Rating must be between 1 and 5." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("movies")
    .update({ status: "watched", rating, watched_on: new Date().toISOString().slice(0, 10) })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/movies");
  revalidatePath("/watchlist");
  return {};
}
```

## Task 1.4: Update MovieForm with status selector

- [ ] **Step 1: Add status state + selector to `app/(authenticated)/movies/MovieForm.tsx`**

After the existing state declarations, add:

```ts
  const [status, setStatus] = useState<"watched" | "watchlist">(
    initial?.status ?? "watched",
  );
```

Replace the rating fieldset render so it's conditional on status:

```tsx
      <fieldset className={styles.statusField}>
        <legend>Status</legend>
        <div className={styles.statusPicker} role="radiogroup">
          <label className={`${styles.statusOption} ${status === "watched" ? styles.statusOn : ""}`}>
            <input
              type="radio"
              name="status"
              value="watched"
              checked={status === "watched"}
              onChange={() => setStatus("watched")}
            />
            🎬 Watched
          </label>
          <label className={`${styles.statusOption} ${status === "watchlist" ? styles.statusOn : ""}`}>
            <input
              type="radio"
              name="status"
              value="watchlist"
              checked={status === "watchlist"}
              onChange={() => setStatus("watchlist")}
            />
            ⭐ Want to watch
          </label>
        </div>
      </fieldset>

      {status === "watched" && (
        <fieldset className={styles.ratingField}>
          <legend>Rating <em>required</em></legend>
          <div className={styles.starPicker} role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                role="radio"
                aria-checked={rating === n}
                className={`${styles.starBtn} ${rating !== null && n <= rating ? styles.starOn : ""}`}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
            <span className={styles.ratingLabel}>{rating ?? "—"} / 5</span>
          </div>
        </fieldset>
      )}
```

(Replace the existing `<fieldset className={styles.ratingField}>...</fieldset>` block with the above.)

- [ ] **Step 2: Update the `handleSubmit` to send status and conditional rating**

Inside `handleSubmit`, change the `MovieInput` literal:

```ts
    const input: MovieInput = {
      title: trimmedTitle,
      year: yearNum,
      rating: status === "watchlist" ? null : rating,
      notes: notes.trim() === "" ? null : notes,
      watched_on: watchedOn === "" ? null : watchedOn,
      tmdb_id: tmdbId,
      poster_path: posterPath,
      overview,
      status,
    };
```

Also update the validation block above it:

```ts
    if (status === "watched") {
      if (rating === null || rating < 1 || rating > 5) {
        setError("Pick a rating from 1 to 5 for watched movies.");
        return;
      }
    }
```

- [ ] **Step 3: Initialise `rating` state to `number | null`**

Find the existing `useState` for rating and update:

```ts
  const [rating, setRating] = useState<number | null>(initial?.rating ?? 4);
```

- [ ] **Step 4: Add status selector styles to `MovieForm.module.css`**

Append:

```css
.statusField {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.statusField legend {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  padding: 0;
  text-shadow: var(--text-emboss-light);
}
.statusPicker {
  display: flex;
  gap: 0.5rem;
}
.statusOption {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 0.7rem;
  background: linear-gradient(180deg, var(--button-white-top) 0%, var(--button-white-bottom) 100%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  text-shadow: var(--text-emboss-light);
  box-shadow:
    var(--gloss-highlight),
    var(--shadow-sm);
}
.statusOption input { display: none; }
.statusOption.statusOn {
  background: linear-gradient(180deg, var(--button-top) 0%, var(--button-bottom) 100%);
  color: var(--accent-fg);
  text-shadow: var(--text-emboss-dark);
  border-color: rgba(0, 0, 0, 0.4);
}
```

## Task 1.5: Update MovieView and MovieList for nullable rating

- [ ] **Step 1: Make MovieView render gracefully when rating is null**

In `app/(authenticated)/movies/MovieView.tsx`, replace `<Stars value={movie.rating} />` with:

```tsx
          {movie.rating !== null && <Stars value={movie.rating} />}
```

- [ ] **Step 2: Make MovieList render gracefully when rating is null**

In `app/(authenticated)/movies/MovieList.tsx`, find both list-row and grid-card render sites. In the list row's rowHeader:

```tsx
                  {m.rating !== null && <Stars value={m.rating} />}
```

In the grid card's cardRating overlay:

```tsx
                {m.rating !== null && (
                  <span className={styles.cardRating}>
                    {"★".repeat(m.rating)}
                  </span>
                )}
```

- [ ] **Step 3: Update sort logic to handle null rating**

In `MovieList.tsx`'s `useMemo`, replace the rating_desc sort branch:

```ts
      if (sort === "rating_desc") return (b.rating ?? 0) - (a.rating ?? 0);
```

## Task 1.6: Filter /movies to status='watched'

- [ ] **Step 1: Add the filter to the moved page.tsx**

In `app/(authenticated)/movies/page.tsx`, change the query to:

```ts
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "watched")
    .order("watched_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
```

## Task 1.7: Build the watchlist page

- [ ] **Step 1: Create `app/(authenticated)/watchlist/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import type { Movie } from "@/app/(authenticated)/movies/types";
import PosterImage from "@/app/(authenticated)/movies/PosterImage";
import MarkWatchedButton from "./MarkWatchedButton";
import sharedStyles from "@/app/(authenticated)/movies/MovieList.module.css";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "watchlist")
    .order("created_at", { ascending: false });

  const movies = (data ?? []) as Movie[];

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.4rem" }}>⭐ Watchlist</h2>

      {error && <div className="error">Failed to load: {error.message}</div>}

      {movies.length === 0 ? (
        <div className={sharedStyles.emptyCard}>
          <h2>Your watchlist is empty</h2>
          <p>Add movies from Trending or Discover to plan what you&apos;ll watch next.</p>
        </div>
      ) : (
        <ul className={sharedStyles.list}>
          {movies.map((m) => (
            <li key={m.id} className={sharedStyles.row}>
              <div className={sharedStyles.thumbInRow}>
                <PosterImage posterPath={m.poster_path} title={m.title} size="w92" width={60} height={90} />
              </div>
              <div className={sharedStyles.rowMain}>
                <div className={sharedStyles.rowHeader}>
                  <strong className={sharedStyles.rowTitle}>{m.title}</strong>
                  {m.year !== null && <span className={sharedStyles.year}>({m.year})</span>}
                </div>
                {m.overview && <p className={sharedStyles.overview}>{m.overview}</p>}
              </div>
              <div className={sharedStyles.rowActions}>
                <MarkWatchedButton id={m.id} title={m.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(authenticated)/watchlist/MarkWatchedButton.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { markAsWatched } from "@/app/(authenticated)/movies/actions";
import styles from "./MarkWatchedButton.module.css";

export default function MarkWatchedButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(4);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await markAsWatched(id, rating);
      if (res.error) setError(res.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button type="button" className="primary" onClick={() => setOpen(true)}>
        Mark watched
      </button>
    );
  }

  return (
    <div className={styles.prompt}>
      <div className={styles.title}>Rate &ldquo;{title}&rdquo;</div>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} stars`}
            className={`${styles.starBtn} ${n <= rating ? styles.starOn : ""}`}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      <div className={styles.actions}>
        <button type="button" onClick={() => setOpen(false)} disabled={isPending}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={submit} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(authenticated)/watchlist/MarkWatchedButton.module.css`**

```css
.prompt {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.6rem;
  background: var(--panel);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  min-width: 14rem;
}
.title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}
.stars {
  display: flex;
  gap: 0.1rem;
}
.starBtn {
  background: transparent;
  border: none;
  padding: 0.2rem;
  font-size: 1.4rem;
  line-height: 1;
  color: var(--gold-dim);
  box-shadow: none;
  text-shadow: none;
}
.starBtn:hover:not(:disabled),
.starOn {
  color: var(--gold-bottom);
  background: transparent;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  margin-top: 0.2rem;
}
```

## Task 1.8: Verify and commit

- [ ] **Step 1: Lint + build (placeholder env)**

```bash
cd c:/Users/AyaanAhmed/Desktop/Practice/Exercise5
npm run lint
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
  TMDB_API_KEY="placeholder" \
  npm run build
```

- [ ] **Step 2: Commit**

```bash
cd c:/Users/AyaanAhmed/Desktop/Practice
git add -A Exercise5
git commit -m "$(cat <<'EOF'
Exercise5: phase 1 — watchlist

Schema migration adds status column (watched|watchlist) with default
'watched' so existing rows are preserved. Rating becomes nullable for
watchlist entries via a status-aware CHECK constraint.

MovieForm gets a status toggle; rating section hides when status is
watchlist. /movies query filters to status='watched'. New /watchlist
page renders the want-to-watch list with a per-row "Mark watched"
button that opens an inline 1-5 rating prompt and calls a new
markAsWatched server action.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 2 — Trending

## Task 2.1: Add `getTrending` Server Action

- [ ] **Step 1: Append to `app/(authenticated)/movies/tmdb.ts`**

```ts
const TRENDING_ENDPOINT = "https://api.themoviedb.org/3/trending/movie/week";

export async function getTrending(): Promise<SearchResponse> {
  const token = process.env.TMDB_API_KEY;
  if (!token) return { results: [], error: "TMDB key not configured" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${TRENDING_ENDPOINT}?language=en-US`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return { results: [] };
    const data = (await res.json()) as { results?: TmdbApiMovie[] };
    return { results: (data.results ?? []).slice(0, 20).map(toTmdbResult) };
  } catch {
    return { results: [] };
  } finally {
    clearTimeout(timer);
  }
}
```

## Task 2.2: PosterGrid component

- [ ] **Step 1: Create `app/components/PosterGrid.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { TmdbResult } from "@/app/(authenticated)/movies/tmdb";
import { posterUrl } from "@/app/(authenticated)/movies/poster";
import styles from "./PosterGrid.module.css";

type Props = { results: TmdbResult[] };

export default function PosterGrid({ results }: Props) {
  const sorted = useMemo(() => results, [results]);

  if (sorted.length === 0) {
    return <p className={styles.empty}>No results.</p>;
  }

  return (
    <ul className={styles.grid}>
      {sorted.map((r) => {
        const url = posterUrl(r.poster_path, "w342");
        const params = new URLSearchParams({
          add: "1",
          tmdb_id: String(r.tmdb_id),
          title: r.title,
          year: r.year !== null ? String(r.year) : "",
          poster_path: r.poster_path ?? "",
          overview: r.overview ?? "",
        });
        const baseHref = `/movies?${params.toString()}`;
        return (
          <li key={r.tmdb_id} className={styles.card}>
            <div className={styles.poster}>
              {url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt={`${r.title} poster`} />
              ) : (
                <div className={styles.placeholder}>🎬</div>
              )}
            </div>
            <div className={styles.body}>
              <span className={styles.title} title={r.title}>{r.title}</span>
              {r.year !== null && <span className={styles.year}>{r.year}</span>}
              <div className={styles.actions}>
                <Link className={styles.actionBtn} href={`${baseHref}&status=watchlist`}>
                  + Watchlist
                </Link>
                <Link className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} href={`${baseHref}&status=watched`}>
                  + Watched
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 2: Create `app/components/PosterGrid.module.css`**

```css
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
@media (max-width: 900px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 380px) {
  .grid { grid-template-columns: 1fr; }
}

.empty {
  color: var(--text-dim);
  text-align: center;
  padding: 2rem 0;
}

.card {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 4px 8px rgba(0, 0, 0, 0.35);
}

.poster {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: #1c1c1e;
}
.poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 2rem;
}

.body {
  padding: 0.55rem 0.7rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}
.title {
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: var(--text-emboss-light);
}
.year {
  color: var(--text-dim);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.4rem;
}
.actionBtn {
  flex: 1;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  padding: 0.35rem 0.4rem;
  border-radius: var(--radius-sm);
  background: linear-gradient(180deg, var(--button-white-top) 0%, var(--button-white-bottom) 100%);
  border: 1px solid var(--border-strong);
  color: var(--text);
  text-shadow: var(--text-emboss-light);
  box-shadow: var(--gloss-highlight), var(--shadow-sm);
}
.actionBtn:hover { filter: brightness(1.04); text-decoration: none; }
.actionBtnPrimary {
  background: linear-gradient(180deg, var(--button-top) 0%, var(--button-bottom) 100%);
  color: var(--accent-fg);
  border-color: rgba(0, 0, 0, 0.4);
  text-shadow: var(--text-emboss-dark);
}
```

## Task 2.3: Trending page

- [ ] **Step 1: Create `app/(authenticated)/trending/page.tsx`**

```tsx
import { getTrending } from "@/app/(authenticated)/movies/tmdb";
import PosterGrid from "@/app/components/PosterGrid";

export default async function TrendingPage() {
  const { results, error } = await getTrending();

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.4rem" }}>🔥 Trending this week</h2>
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}
      <PosterGrid results={results} />
    </div>
  );
}
```

## Task 2.4: Wire URL pre-fill into Movies + MovieList + MovieForm

- [ ] **Step 1: Read URL params in `app/(authenticated)/movies/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import MovieList from "./MovieList";
import type { Movie, MovieInput } from "./types";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{
    add?: string;
    status?: string;
    title?: string;
    year?: string;
    tmdb_id?: string;
    poster_path?: string;
    overview?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "watched")
    .order("watched_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const sp = await searchParams;
  const prefill: Partial<MovieInput> | null = sp.add
    ? {
        title: sp.title ?? "",
        year: sp.year ? Number(sp.year) || null : null,
        tmdb_id: sp.tmdb_id ? Number(sp.tmdb_id) || null : null,
        poster_path: sp.poster_path && sp.poster_path.length > 0 ? sp.poster_path : null,
        overview: sp.overview && sp.overview.length > 0 ? sp.overview : null,
        status: sp.status === "watchlist" ? "watchlist" : "watched",
      }
    : null;

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      {error ? (
        <div className="error">Failed to load movies: {error.message}</div>
      ) : (
        <MovieList initialMovies={(data ?? []) as Movie[]} prefill={prefill} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Accept the `prefill` prop in `MovieList.tsx`**

Update the props interface:

```ts
export default function MovieList({
  initialMovies,
  prefill,
}: {
  initialMovies: Movie[];
  prefill?: Partial<import("./types").MovieInput> | null;
}) {
```

After the existing state initialisers, add:

```ts
  const router = useRouter();
  const [pendingPrefill, setPendingPrefill] = useState<typeof prefill>(prefill ?? null);
  useEffect(() => {
    if (pendingPrefill) {
      setIsAdding(true);
      // Strip the prefill params from the URL so a refresh doesn't reopen the form
      router.replace("/movies");
    }
  }, [pendingPrefill, router]);
```

Add the imports at the top of the file (alongside the existing `useMemo, useState, useTransition` from react):

```ts
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
```

When opening MovieForm in create mode, pass the prefill:

```tsx
  if (isAdding) {
    return (
      <MovieForm
        mode="create"
        prefill={pendingPrefill ?? undefined}
        onClose={() => {
          setIsAdding(false);
          setPendingPrefill(null);
        }}
      />
    );
  }
```

- [ ] **Step 3: Accept `prefill` in `MovieForm.tsx`**

Update `Props`:

```ts
type Props =
  | {
      mode: "create";
      onClose: () => void;
      initial?: undefined;
      prefill?: Partial<import("./types").MovieInput>;
    }
  | { mode: "edit"; onClose: () => void; initial: Movie; prefill?: undefined };
```

Update default values to consult prefill in create mode (after the initial state declarations, replace each `useState(initial?.<field> ?? <default>)` so the prefill can override when in create mode):

```ts
  const seed = initial ?? prefill;
  const [title, setTitle] = useState(seed?.title ?? "");
  const [year, setYear] = useState(seed?.year != null ? String(seed.year) : "");
  const [rating, setRating] = useState<number | null>(seed?.rating ?? 4);
  const [watchedOn, setWatchedOn] = useState(seed?.watched_on ?? "");
  const [notes, setNotes] = useState(seed?.notes ?? "");
  const [tmdbId, setTmdbId] = useState<number | null>(seed?.tmdb_id ?? null);
  const [posterPath, setPosterPath] = useState<string | null>(seed?.poster_path ?? null);
  const [overview, setOverview] = useState<string | null>(seed?.overview ?? null);
  const [status, setStatus] = useState<"watched" | "watchlist">(seed?.status ?? "watched");
```

## Task 2.5: Verify and commit

- [ ] **Step 1: Lint + build**

Same commands as Task 1.8.

- [ ] **Step 2: Commit**

```bash
cd c:/Users/AyaanAhmed/Desktop/Practice
git add -A Exercise5
git commit -m "$(cat <<'EOF'
Exercise5: phase 2 — TMDB trending + shared PosterGrid

Adds getTrending() server action calling /trending/movie/week. New
/trending page renders 20 results in a shared PosterGrid component
that's reused by Discover next phase. Each card has +Watchlist /
+Watched buttons that hand off to /movies?add=1&status=...&tmdb_id=...
which auto-opens MovieForm pre-filled with the TMDB metadata.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 3 — Discover by genre

## Task 3.1: TMDB actions

- [ ] **Step 1: Append to `app/(authenticated)/movies/tmdb.ts`**

```ts
const GENRES_ENDPOINT = "https://api.themoviedb.org/3/genre/movie/list";
const DISCOVER_ENDPOINT = "https://api.themoviedb.org/3/discover/movie";

export type TmdbGenre = { id: number; name: string };

export async function getGenres(): Promise<{ genres: TmdbGenre[]; error?: string }> {
  const token = process.env.TMDB_API_KEY;
  if (!token) return { genres: [], error: "TMDB key not configured" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${GENRES_ENDPOINT}?language=en-US`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return { genres: [] };
    const data = (await res.json()) as { genres?: TmdbGenre[] };
    return { genres: data.genres ?? [] };
  } catch {
    return { genres: [] };
  } finally {
    clearTimeout(timer);
  }
}

export async function discoverByGenre(genreId: number): Promise<SearchResponse> {
  if (!Number.isInteger(genreId) || genreId <= 0) return { results: [] };

  const token = process.env.TMDB_API_KEY;
  if (!token) return { results: [], error: "TMDB key not configured" };

  const url = new URL(DISCOVER_ENDPOINT);
  url.searchParams.set("with_genres", String(genreId));
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", "1");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return { results: [] };
    const data = (await res.json()) as { results?: TmdbApiMovie[] };
    return { results: (data.results ?? []).slice(0, 20).map(toTmdbResult) };
  } catch {
    return { results: [] };
  } finally {
    clearTimeout(timer);
  }
}
```

## Task 3.2: Discover landing page

- [ ] **Step 1: Create `app/(authenticated)/discover/discover.module.css`**

```css
.wrap {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}
.heading {
  margin: 0 0 1rem;
  font-size: 1.4rem;
  text-shadow: var(--text-emboss-light);
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
@media (max-width: 720px) { .grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 480px) { .grid { grid-template-columns: repeat(2, 1fr); } }

.tile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.1rem 0.6rem;
  background: linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text);
  text-decoration: none;
  text-align: center;
  text-shadow: var(--text-emboss-light);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), var(--shadow-sm);
}
.tile:hover {
  filter: brightness(1.04);
  text-decoration: none;
}
```

- [ ] **Step 2: Create `app/(authenticated)/discover/page.tsx`**

```tsx
import Link from "next/link";
import { getGenres } from "@/app/(authenticated)/movies/tmdb";
import styles from "./discover.module.css";

export default async function DiscoverPage() {
  const { genres, error } = await getGenres();

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>🎭 Browse by genre</h2>
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}
      <ul className={styles.grid}>
        {genres.map((g) => (
          <li key={g.id}>
            <Link className={styles.tile} href={`/discover/${g.id}?name=${encodeURIComponent(g.name)}`}>
              {g.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Task 3.3: Genre results page

- [ ] **Step 1: Create `app/(authenticated)/discover/[genreId]/page.tsx`**

```tsx
import { discoverByGenre } from "@/app/(authenticated)/movies/tmdb";
import PosterGrid from "@/app/components/PosterGrid";

export default async function GenrePage({
  params,
  searchParams,
}: {
  params: Promise<{ genreId: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { genreId } = await params;
  const sp = await searchParams;
  const id = Number(genreId);
  const { results, error } = Number.isInteger(id) && id > 0
    ? await discoverByGenre(id)
    : { results: [], error: "Invalid genre id" };

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.4rem" }}>
        🎭 {sp.name ?? "Genre"}
      </h2>
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}
      <PosterGrid results={results} />
    </div>
  );
}
```

## Task 3.4: Verify and commit

- [ ] **Step 1: Lint + build** (same commands)

- [ ] **Step 2: Commit**

```bash
git add -A Exercise5
git commit -m "$(cat <<'EOF'
Exercise5: phase 3 — discover by genre

Adds getGenres() and discoverByGenre(id) server actions. /discover
shows the ~19 TMDB movie genres as tiles; tapping a tile navigates to
/discover/[genreId] which renders the popular movies in that genre
via the shared PosterGrid (same +Watchlist / +Watched flow as
Trending).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 4 — Stats

## Task 4.1: StatsBars component

- [ ] **Step 1: Create `app/components/StatsBars.module.css`**

```css
.barRow {
  display: grid;
  grid-template-columns: 3rem 1fr 2.5rem;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}
.barLabel {
  font-size: 0.85rem;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  text-shadow: var(--text-emboss-light);
}
.barTrack {
  height: 14px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  box-shadow: var(--inset-shadow);
  overflow: hidden;
}
.barFill {
  height: 100%;
  background: linear-gradient(180deg, var(--gold-top) 0%, var(--gold-bottom) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: width 320ms ease;
}
.barCount {
  font-size: 0.85rem;
  color: var(--text-dim);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: Create `app/components/StatsBars.tsx`**

```tsx
"use client";

import styles from "./StatsBars.module.css";

type Bar = { label: string; count: number };

export default function StatsBars({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.count));
  return (
    <div>
      {bars.map((b) => {
        const pct = (b.count / max) * 100;
        return (
          <div key={b.label} className={styles.barRow}>
            <span className={styles.barLabel}>{b.label}</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.barCount}>{b.count}</span>
          </div>
        );
      })}
    </div>
  );
}
```

## Task 4.2: Stats page

- [ ] **Step 1: Create `app/(authenticated)/stats/stats.module.css`**

```css
.wrap {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.heading {
  margin: 0;
  font-size: 1.4rem;
  text-shadow: var(--text-emboss-light);
}
.bigNumbers {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
@media (max-width: 480px) { .bigNumbers { grid-template-columns: 1fr; } }
.bigCard {
  padding: 1rem 1.25rem;
  background: linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), var(--shadow-sm);
}
.bigLabel {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}
.bigValue {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  text-shadow: var(--text-emboss-light);
  font-variant-numeric: tabular-nums;
}
.section {
  padding: 1rem 1.25rem;
  background: linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), var(--shadow-sm);
}
.sectionTitle {
  margin: 0 0 0.7rem;
  font-size: 1rem;
  text-shadow: var(--text-emboss-light);
}
.topList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.topRow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.92rem;
}
.topYear { color: var(--text-dim); font-variant-numeric: tabular-nums; }
.topRating { color: var(--gold-bottom); font-weight: 700; }
.empty {
  color: var(--text-dim);
  font-style: italic;
}
```

- [ ] **Step 2: Create `app/(authenticated)/stats/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import type { Movie } from "@/app/(authenticated)/movies/types";
import StatsBars from "@/app/components/StatsBars";
import styles from "./stats.module.css";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "watched");

  const movies = (data ?? []) as Movie[];
  const total = movies.length;
  const avg =
    total === 0
      ? 0
      : movies.reduce((s, m) => s + (m.rating ?? 0), 0) / total;

  const ratingBars = [5, 4, 3, 2, 1].map((n) => ({
    label: "★".repeat(n),
    count: movies.filter((m) => m.rating === n).length,
  }));

  const yearCounts = new Map<string, number>();
  for (const m of movies) {
    if (!m.watched_on) continue;
    const year = m.watched_on.slice(0, 4);
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }
  const yearBars = [...yearCounts.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)
    .map(([y, c]) => ({ label: y, count: c }));

  const topRated = [...movies]
    .filter((m) => m.rating !== null)
    .sort((a, b) =>
      (b.rating ?? 0) - (a.rating ?? 0) ||
      a.title.localeCompare(b.title),
    )
    .slice(0, 5);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>📊 Your stats</h2>

      {error && <div className="error">{error.message}</div>}

      <div className={styles.bigNumbers}>
        <div className={styles.bigCard}>
          <div className={styles.bigLabel}>Movies watched</div>
          <div className={styles.bigValue}>{total}</div>
        </div>
        <div className={styles.bigCard}>
          <div className={styles.bigLabel}>Average rating</div>
          <div className={styles.bigValue}>{total === 0 ? "—" : avg.toFixed(2)}</div>
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Ratings distribution</h3>
        {total === 0 ? (
          <p className={styles.empty}>No movies yet.</p>
        ) : (
          <StatsBars bars={ratingBars} />
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Movies per year (last 10)</h3>
        {yearBars.length === 0 ? (
          <p className={styles.empty}>No watched-on dates recorded.</p>
        ) : (
          <StatsBars bars={yearBars} />
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Top 5</h3>
        {topRated.length === 0 ? (
          <p className={styles.empty}>No rated movies yet.</p>
        ) : (
          <ul className={styles.topList}>
            {topRated.map((m) => (
              <li key={m.id} className={styles.topRow}>
                <span className={styles.topRating}>{"★".repeat(m.rating ?? 0)}</span>
                <span>{m.title}</span>
                {m.year !== null && <span className={styles.topYear}>({m.year})</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

## Task 4.3: Verify and commit

```bash
npm run lint
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
  TMDB_API_KEY="placeholder" \
  npm run build

cd c:/Users/AyaanAhmed/Desktop/Practice
git add -A Exercise5
git commit -m "$(cat <<'EOF'
Exercise5: phase 4 — stats dashboard

/stats fetches the user's watched library once and computes total,
average rating, ratings distribution, last-10-years movies-per-year,
and top 5 by rating in JS (data set is small per user). Bars rendered
via a thin StatsBars client component for the CSS-bar fill animation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 5 — Profile

## Task 5.1: Profile server action

- [ ] **Step 1: Create `app/(authenticated)/profile/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(name: string): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 50)
    return { error: "Display name must be 1–50 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: trimmed },
  });

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/movies");
  return {};
}
```

## Task 5.2: Profile page

- [ ] **Step 1: Create `app/(authenticated)/profile/profile.module.css`**

```css
.wrap {
  max-width: 36rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.heading {
  margin: 0;
  font-size: 1.4rem;
  text-shadow: var(--text-emboss-light);
}
.card {
  background: linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), var(--shadow-sm);
}
.field { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.9rem; color: var(--text-dim); }
.field span { font-weight: 600; color: var(--text); text-shadow: var(--text-emboss-light); }
.actions { display: flex; justify-content: flex-end; }
.facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 1rem;
  row-gap: 0.4rem;
  font-size: 0.92rem;
}
.factLabel {
  color: var(--text-dim);
  font-weight: 600;
}
.factValue {
  color: var(--text);
  text-shadow: var(--text-emboss-light);
}
```

- [ ] **Step 2: Create `app/(authenticated)/profile/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";
import styles from "./profile.module.css";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const initialName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : "";

  const [{ count: watchedCount }, { count: watchlistCount }] = await Promise.all([
    supabase.from("movies").select("*", { count: "exact", head: true }).eq("status", "watched"),
    supabase.from("movies").select("*", { count: "exact", head: true }).eq("status", "watchlist"),
  ]);

  const joined = new Date(user.created_at).toLocaleDateString();

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>👤 Profile</h2>

      <div className={styles.card}>
        <ProfileForm initialName={initialName} />
      </div>

      <div className={styles.card}>
        <dl className={styles.facts}>
          <dt className={styles.factLabel}>Email</dt>
          <dd className={styles.factValue}>{user.email}</dd>
          <dt className={styles.factLabel}>Joined</dt>
          <dd className={styles.factValue}>{joined}</dd>
          <dt className={styles.factLabel}>Movies watched</dt>
          <dd className={styles.factValue}>{watchedCount ?? 0}</dd>
          <dt className={styles.factLabel}>On watchlist</dt>
          <dd className={styles.factValue}>{watchlistCount ?? 0}</dd>
        </dl>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(authenticated)/profile/ProfileForm.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { updateDisplayName } from "./actions";

export default function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateDisplayName(name);
      if (res.error) setError(res.error);
      else setSavedAt(Date.now());
    });
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {error && <div className="error">{error}</div>}
      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem" }}>
        <span style={{ fontWeight: 600, color: "var(--text)", textShadow: "var(--text-emboss-light)" }}>Display name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={50}
        />
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", alignItems: "center" }}>
        {savedAt !== null && !isPending && (
          <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>Saved.</span>
        )}
        <button type="submit" className="primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
```

## Task 5.3: Verify and commit

```bash
npm run lint
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
  TMDB_API_KEY="placeholder" \
  npm run build

cd c:/Users/AyaanAhmed/Desktop/Practice
git add -A Exercise5
git commit -m "$(cat <<'EOF'
Exercise5: phase 5 — profile + display-name editing

/profile reads auth.users + user_metadata, lets the user edit their
display name via supabase.auth.updateUser, and shows joined-on date
plus watched/watchlist counts. revalidatePath('/movies') keeps the
sidebar's user card in sync after a save.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Done criteria

- [ ] Sidebar appears on every authenticated page; mobile hamburger toggles drawer; active item matches URL.
- [ ] Migration applied; existing rows have `status='watched'`; rating is now nullable for watchlist.
- [ ] `/movies` shows only watched; `/watchlist` shows only watchlist; "Mark watched" prompts for rating and moves the row.
- [ ] `/trending` shows 20 posters within ~1s of load; "+ Watchlist" / "+ Watched" buttons land on `/movies` with the form pre-opened and pre-filled.
- [ ] `/discover` lists ~19 genres; clicking one shows its results.
- [ ] `/stats` shows total, avg, ratings histogram, year bars, top 5.
- [ ] `/profile` saves a new display name and the sidebar's user card updates on next page load.
- [ ] `npm run lint` clean; `npm run build` succeeds at every phase.
- [ ] Six commits land in order on `main`.
