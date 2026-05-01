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
