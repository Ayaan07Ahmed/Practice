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
