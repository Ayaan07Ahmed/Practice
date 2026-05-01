-- Movie Tracker schema
-- Paste this into the Supabase SQL Editor (Project → SQL Editor → New query) and Run.

create table if not exists public.movies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  year        int  null
              check (year is null or (year >= 1888 and year <= extract(year from now())::int + 5)),
  rating      int  null,
  notes       text null check (notes is null or char_length(notes) <= 2000),
  watched_on  date null,
  tmdb_id     int  null,
  poster_path text null
              check (poster_path is null or char_length(poster_path) <= 200),
  overview    text null
              check (overview is null or char_length(overview) <= 4000),
  created_at  timestamptz not null default now(),
  status      text not null default 'watched'
              check (status in ('watched','watchlist')),
  -- Mirrors validate() in app/(authenticated)/movies/actions.ts.
  constraint movies_rating_check check (
    (status = 'watchlist' and rating is null)
    or (status = 'watched' and rating between 1 and 5)
  )
);

create index if not exists movies_user_watched_idx
  on public.movies (user_id, watched_on desc nulls last, created_at desc);

create index if not exists movies_user_rating_idx
  on public.movies (user_id, rating);

create index if not exists movies_user_title_idx
  on public.movies (user_id, lower(title));

create index if not exists movies_user_tmdb_idx
  on public.movies (user_id, tmdb_id)
  where tmdb_id is not null;

create index if not exists movies_user_status_idx
  on public.movies (user_id, status);

alter table public.movies enable row level security;

drop policy if exists "movies_select_own" on public.movies;
drop policy if exists "movies_insert_own" on public.movies;
drop policy if exists "movies_update_own" on public.movies;
drop policy if exists "movies_delete_own" on public.movies;

create policy "movies_select_own"
  on public.movies for select
  using (auth.uid() = user_id);

create policy "movies_insert_own"
  on public.movies for insert
  with check (auth.uid() = user_id);

create policy "movies_update_own"
  on public.movies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "movies_delete_own"
  on public.movies for delete
  using (auth.uid() = user_id);
