# Movie Tracker — Design Spec

## Context

The user is using `c:\Users\AyaanAhmed\Desktop\Practice` as a learning workspace, with each exercise in its own `ExerciseN/` folder (Exercise1, 3, 4 already exist). They want their first Supabase + Next.js project — a real, deployable web app that exercises the database, auth, and Row Level Security features of Supabase end-to-end. The project intentionally chooses the more involved "full SSR with `@supabase/ssr`" path (over a simpler client-only setup) because the goal is learning the modern Next.js + Supabase patterns, not just shipping a feature.

**Outcome:** a working movie tracker at `Exercise5/` where each user signs up, logs movies they've watched, and searches/sorts/filters their personal list — with per-user data isolation enforced by Postgres RLS.

> Note (post-scaffold): `create-next-app` landed on **Next.js 16.2.4** (not 15 as originally drafted). In Next.js 16, the `middleware.ts` file convention has been **renamed to `proxy.ts`** (function name `proxy`). All references below reflect the as-built code.

---

## Summary

A Next.js 16 (App Router, TypeScript) web app backed by Supabase. Email + password auth via cookies (`@supabase/ssr`). One Postgres table `movies` protected by RLS. CSS Modules for styling, dark visual style consistent with Exercise4.

**Features in v1:** signup, login, logout; create/read/update/delete movies; client-side search by title; sort by date / rating / title; filter by minimum rating.

---

## Architecture

**Stack**
- Next.js 16 (App Router) + TypeScript
- React 19
- `@supabase/supabase-js` + `@supabase/ssr` (cookie-based auth)
- CSS Modules + a single `app/globals.css` with custom-property tokens
- Supabase hosted project (free tier)

**Folder layout (under `Exercise5/`)**

```
Exercise5/
  app/
    layout.tsx
    globals.css
    page.tsx                    # redirects → /login or /movies
    login/
      page.tsx                  # client component
      auth.module.css
    signup/page.tsx             # client component (reuses login/auth.module.css)
    movies/
      page.tsx                  # server component: fetches user's movies
      MovieList.tsx             # client: search/sort/filter UI
      MovieForm.tsx             # client: add / edit form
      actions.ts                # server actions: create/update/delete
      types.ts
      page.module.css
      MovieList.module.css
      MovieForm.module.css
    auth/
      signout/route.ts
  lib/supabase/
    server.ts                   # createServerClient() for Server Components/Actions
    client.ts                   # createBrowserClient() for Client Components
    proxy.ts                    # session-refresh helper used by root proxy.ts
  proxy.ts                      # gates /movies, refreshes cookie (Next 16: replaces middleware.ts)
  supabase/schema.sql           # paste into Supabase SQL editor
  .env.local.example            # committed template (no secrets)
  .env.local                    # gitignored
  package.json / tsconfig.json / next.config.ts
  README.md
```

**Why this shape**
- Server Components fetch the initial movie list with the user's session cookie → no flash of empty state.
- Server Actions handle mutations directly from forms → no separate `/api` routes.
- `MovieList` is a small client island that filters/sorts the already-fetched array in memory — simple and fast.
- Root `proxy.ts` is the standard `@supabase/ssr` pattern (Next 16's renamed middleware): refreshes auth cookies on every request and redirects unauthenticated users away from `/movies`.

---

## Data model

**Table `movies`**

| Column       | Type                                       | Constraints                                    |
|--------------|--------------------------------------------|------------------------------------------------|
| `id`         | `uuid`                                     | PK, default `gen_random_uuid()`                |
| `user_id`    | `uuid`                                     | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE |
| `title`      | `text`                                     | NOT NULL, CHECK `char_length(title) BETWEEN 1 AND 200` |
| `year`       | `int`                                      | NULL, CHECK `1888 ≤ year ≤ extract(year from now())::int + 5` |
| `rating`     | `int`                                      | NOT NULL, CHECK `rating BETWEEN 1 AND 5`       |
| `notes`      | `text`                                     | NULL, CHECK `char_length(notes) ≤ 2000`        |
| `watched_on` | `date`                                     | NULL                                           |
| `created_at` | `timestamptz`                              | NOT NULL, default `now()`                      |

**Indexes**
- `(user_id, watched_on desc nulls last, created_at desc)` — primary list query
- `(user_id, rating)` — filter-by-min-rating
- `(user_id, lower(title))` — search

**Row Level Security** (enabled on `movies`)
- `select`, `insert` (WITH CHECK), `update` (USING + WITH CHECK), `delete`: each `auth.uid() = user_id`.

**Auth (Supabase dashboard)**
- Email + password provider enabled
- Email confirmation **disabled** for v1; README documents how to enable later
- No social providers

---

## User flows

1. **Sign up → first movie:** `/` → proxy redirects to `/login` → "Create account" → `/signup` → `signUp()` sets session cookie → `/movies` → empty state → add first movie via `MovieForm` → Server Action `createMovie()` → `revalidatePath('/movies')`.
2. **Returning user:** `/` → proxy redirects to `/movies` → Server Component fetches movies for `auth.uid()` → renders `MovieList` → user searches/sorts/filters client-side.
3. **Edit / delete:** row buttons swap the list view for a prefilled `MovieForm`, or trigger a confirm dialog → `updateMovie()` / `deleteMovie()` Server Actions → `revalidatePath`.
4. **Sign out:** header form POSTs `/auth/signout/route.ts` → clears cookie → 303 redirect to `/login`.

**MovieForm fields:** title (required, 1–200), year (optional int), rating (required, 1–5 star picker), watched-on (optional date), notes (optional textarea ≤ 2000). Client-side validation mirrors DB CHECKs; server actions revalidate again.

**Errors:** auth and Server Action errors render as inline messages above the form, not toasts. Failed mutations re-enable the submit button.

**Visual style:** dark theme similar to Exercise4's countdown timer — slate/navy background, sky-blue accent, rounded panels, custom-property tokens in `globals.css`.

---

## Out of scope (v1)

Password reset · email confirmation · profile page · bulk import · TMDB poster lookup · social features · light/dark toggle · mobile-optimized layout (responsive but not tuned).
