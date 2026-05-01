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
