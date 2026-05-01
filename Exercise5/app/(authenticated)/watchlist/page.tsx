import { createClient } from "@/lib/supabase/server";
import type { Movie } from "@/app/(authenticated)/movies/types";
import WatchlistList from "./WatchlistList";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "watchlist")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.4rem" }}>⭐ Watchlist</h2>
      {error && <div className="error">Failed to load: {error.message}</div>}
      <WatchlistList initialMovies={(data ?? []) as Movie[]} />
    </div>
  );
}
