# Exercise5 — Movie Tracker

Personal movie tracker built with **Next.js 16 (App Router) + Supabase** to learn server-side auth, RLS-protected Postgres, and Server Actions.

## What it does

- Email + password signup / login (cookie-based session via `@supabase/ssr`)
- Add / edit / delete movies you've watched (title, year, 1–5★ rating, watched date, notes)
- Search by title, sort by date / rating / title, filter by minimum rating
- Per-user data isolation enforced by Postgres Row Level Security

## Setup

### 1. Install dependencies

```bash
cd Exercise5
npm install
```

### 2. Create a Supabase project

1. Go to https://supabase.com/dashboard, create a new project (free tier is fine), and wait for it to provision.
2. **Settings → API** — copy the *Project URL* and *anon public* key.
3. Create `.env.local` from the template and paste the values:

   ```bash
   cp .env.local.example .env.local
   # then edit .env.local with your URL + anon key
   ```

### 3. Run the schema

In the Supabase dashboard, open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**. This creates the `movies` table, indexes, and RLS policies.

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

### 4. Email confirmation + redirect URLs

In the Supabase dashboard:

1. **Authentication → Providers → Email** → keep **Confirm email** **on** (default). New signups get a verification email with a link that posts back to `/auth/callback` in the app.
2. **Authentication → URL Configuration → Site URL** → set to your deployed origin (e.g. `https://your-app.vercel.app`). For local-only use, `http://localhost:3000` is fine.
3. **Authentication → URL Configuration → Redirect URLs** → add both:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-url>/auth/callback` (if deployed)

If you want signups to skip confirmation during early local development, you can flip "Confirm email" off — new accounts will then sign in immediately.

### 5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## Project layout

| Path                                         | Purpose                                                  |
|----------------------------------------------|----------------------------------------------------------|
| `proxy.ts`                                   | Next.js 16 proxy (formerly `middleware.ts`) — refreshes the auth cookie and gates `/movies` |
| `lib/supabase/{server,client,proxy}.ts`      | Supabase client factories for Server Components, Client Components, and the proxy |
| `app/page.tsx`                               | `/` — redirects to `/movies` or `/login` based on session |
| `app/{login,signup}/page.tsx`                | Auth forms                                               |
| `app/auth/signout/route.ts`                  | POST handler that clears the session                     |
| `app/movies/page.tsx`                        | Server Component — fetches the user's movies             |
| `app/movies/MovieList.tsx`                   | Client Component — search / sort / filter UI             |
| `app/movies/MovieForm.tsx`                   | Client Component — add / edit form                       |
| `app/movies/actions.ts`                      | Server Actions — `createMovie`, `updateMovie`, `deleteMovie` |
| `app/movies/PosterImage.tsx`                 | `next/image` wrapper with sage placeholder fallback     |
| `app/movies/TmdbCombobox.tsx`                | Type-ahead dropdown for the title field                 |
| `app/movies/ViewToggle.tsx`                  | List/grid toggle                                        |
| `app/movies/poster.ts`                       | Build TMDB image CDN URLs                               |
| `app/movies/tmdb.ts`                         | Server Action — search TMDB                             |
| `app/movies/types.ts`                        | Shared `Movie` / `MovieInput` types                      |
| `supabase/migrations/2026-04-30-tmdb.sql`    | Adds `tmdb_id`/`poster_path`/`overview` columns         |
| `supabase/schema.sql`                        | DDL + RLS policies                                       |

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run lint    # eslint
```

## Verification (manual end-to-end test)

After setup, exercise these flows:

1. Visit `/movies` while logged out → redirected to `/login`.
2. Sign up `test1@example.com` → land on `/movies` empty state.
3. Add a movie → confirm it renders.
4. Edit rating → list updates without manual refresh.
5. Delete the movie → empty state returns.
6. Add 3 movies with different titles / ratings / dates → exercise search, sort, and min-rating filter.
7. In a private window, sign up `test2@example.com` → confirm `/movies` is empty (RLS isolates user data).
8. Sign out → `/login` again, `/movies` blocked.
9. Sign in, hard-refresh `/movies` → list persists (cookie session).
10. `npm run lint` clean, `npm run build` succeeds.

### TMDB verification

11. **Type-ahead:** add a movie, type "Dune" — within ~500ms a dropdown shows ≥ 2 results with thumbnails. Click "Dune: Part Two" → title and year fill. Save → row appears in list with a real poster.
12. **Manual entry:** type "asdfqwer" → dropdown shows "No suggestions" or only the manual fallback row → save → row stores with sage placeholder.
13. **Bad key:** set `TMDB_API_KEY=invalid` and restart dev server → typing in the title field shows "TMDB key not configured" inline; manual entry still works.
14. **View toggle:** click ▦ Grid → poster cards. Reload → grid persists. Resize 1024 → 600 → 400 → columns go 3 → 2 → 1.
15. **Mismatch protection:** select a TMDB result, then type extra characters in the title → metadata clears (verify by saving and looking at the row — no poster).

## Notes

- This was scaffolded onto Next.js 16, where the `middleware.ts` file convention has been **renamed to `proxy.ts`** (function name `proxy`). If you compare to older Supabase tutorials that say `middleware.ts`, treat them as equivalent.
- `cookies()` from `next/headers` is async (must be awaited) since Next.js 15.
- Email confirmation is disabled to keep the feedback loop tight while learning. Re-enable it for any production-like use.
