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

### 4. Disable email confirmation (v1)

In the Supabase dashboard, **Authentication → Providers → Email**, turn **Confirm email** off. This lets new accounts sign in immediately without an inbox round-trip. (Re-enable it for any real deployment.)

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
| `app/movies/types.ts`                        | Shared `Movie` / `MovieInput` types                      |
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

## Notes

- This was scaffolded onto Next.js 16, where the `middleware.ts` file convention has been **renamed to `proxy.ts`** (function name `proxy`). If you compare to older Supabase tutorials that say `middleware.ts`, treat them as equivalent.
- `cookies()` from `next/headers` is async (must be awaited) since Next.js 15.
- Email confirmation is disabled to keep the feedback loop tight while learning. Re-enable it for any production-like use.
