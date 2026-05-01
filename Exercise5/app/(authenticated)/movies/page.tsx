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
