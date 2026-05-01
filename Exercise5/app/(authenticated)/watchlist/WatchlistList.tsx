"use client";

import { useState, useTransition } from "react";
import type { Movie } from "@/app/(authenticated)/movies/types";
import { deleteMovie, markAsWatched } from "@/app/(authenticated)/movies/actions";
import MovieForm from "@/app/(authenticated)/movies/MovieForm";
import MovieView from "@/app/(authenticated)/movies/MovieView";
import PosterImage from "@/app/(authenticated)/movies/PosterImage";
import sharedStyles from "@/app/(authenticated)/movies/MovieList.module.css";

export default function WatchlistList({ initialMovies }: { initialMovies: Movie[] }) {
  const [viewing, setViewing] = useState<Movie | null>(null);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (editing) {
    return <MovieForm mode="edit" initial={editing} onClose={() => setEditing(null)} />;
  }

  if (viewing) {
    return (
      <MovieView
        key={viewing.id}
        movie={viewing}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
        }}
        onDelete={() => {
          if (!confirm(`Delete "${viewing.title}"? This cannot be undone.`)) return;
          setError(null);
          setPendingId(viewing.id);
          startTransition(async () => {
            const res = await deleteMovie(viewing.id);
            setPendingId(null);
            if (res.error) setError(res.error);
            else setViewing(null);
          });
        }}
        isDeleting={pendingId === viewing.id}
        onClose={() => setViewing(null)}
        onMarkWatched={async (rating) => {
          const today = new Date();
          const watchedOn = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          const res = await markAsWatched(viewing.id, rating, watchedOn);
          if (res.error) throw new Error(res.error);
          setViewing(null);
        }}
      />
    );
  }

  return (
    <>
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {initialMovies.length === 0 ? (
        <div className={sharedStyles.emptyCard}>
          <h2>Your watchlist is empty</h2>
          <p>Add movies from Trending or Discover to plan what you&apos;ll watch next.</p>
        </div>
      ) : (
        <ul className={sharedStyles.list}>
          {initialMovies.map((m) => (
            <li
              key={m.id}
              className={sharedStyles.row}
              onClick={() => setViewing(m)}
            >
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
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
