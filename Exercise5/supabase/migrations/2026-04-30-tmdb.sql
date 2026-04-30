alter table public.movies
  add column if not exists tmdb_id     int  null,
  add column if not exists poster_path text null
    check (poster_path is null or char_length(poster_path) <= 200),
  add column if not exists overview    text null
    check (overview is null or char_length(overview) <= 4000);

create index if not exists movies_user_tmdb_idx
  on public.movies (user_id, tmdb_id)
  where tmdb_id is not null;
