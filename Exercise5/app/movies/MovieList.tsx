"use client";

import { useMemo, useState, useTransition } from "react";
import type { Movie } from "./types";
import { deleteMovie } from "./actions";
import MovieForm from "./MovieForm";
import styles from "./MovieList.module.css";

type SortKey = "watched_desc" | "rating_desc" | "title_asc";

export default function MovieList({ initialMovies }: { initialMovies: Movie[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("watched_desc");
  const [minRating, setMinRating] = useState<number>(0);

  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = initialMovies;
    if (q) list = list.filter((m) => m.title.toLowerCase().includes(q));
    if (minRating > 0) list = list.filter((m) => m.rating >= minRating);
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "rating_desc") return b.rating - a.rating;
      if (sort === "title_asc") return a.title.localeCompare(b.title);
      // watched_desc
      const aw = a.watched_on ?? "";
      const bw = b.watched_on ?? "";
      if (aw === bw) return b.created_at.localeCompare(a.created_at);
      if (!aw) return 1;
      if (!bw) return -1;
      return bw.localeCompare(aw);
    });
    return sorted;
  }, [initialMovies, search, sort, minRating]);

  function handleDelete(movie: Movie) {
    if (!confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;
    setError(null);
    setPendingId(movie.id);
    startTransition(async () => {
      const res = await deleteMovie(movie.id);
      setPendingId(null);
      if (res.error) setError(res.error);
    });
  }

  if (isAdding) {
    return (
      <MovieForm
        mode="create"
        onClose={() => setIsAdding(false)}
      />
    );
  }
  if (editing) {
    return (
      <MovieForm
        mode="edit"
        initial={editing}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.toolbar}>
        <button className="primary" onClick={() => setIsAdding(true)}>
          + Add movie
        </button>

        <div className={styles.controls}>
          <input
            type="search"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="watched_desc">Sort: Date watched ↓</option>
            <option value="rating_desc">Sort: Rating ↓</option>
            <option value="title_asc">Sort: Title A→Z</option>
          </select>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            aria-label="Minimum rating"
          >
            <option value={0}>Min ★: Any</option>
            <option value={1}>Min ★: 1</option>
            <option value={2}>Min ★: 2</option>
            <option value={3}>Min ★: 3</option>
            <option value={4}>Min ★: 4</option>
            <option value={5}>Min ★: 5</option>
          </select>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {initialMovies.length === 0 ? (
        <EmptyState onAdd={() => setIsAdding(true)} />
      ) : visible.length === 0 ? (
        <p className={styles.empty}>No movies match your filters.</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((m) => (
            <li key={m.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowHeader}>
                  <Stars value={m.rating} />
                  <strong className={styles.rowTitle}>{m.title}</strong>
                  {m.year !== null && <span className={styles.year}>({m.year})</span>}
                  {m.watched_on && <span className={styles.date}>{m.watched_on}</span>}
                </div>
                {m.notes && <p className={styles.notes}>“{m.notes}”</p>}
              </div>
              <div className={styles.rowActions}>
                <button onClick={() => setEditing(m)} disabled={pendingId === m.id}>
                  Edit
                </button>
                <button
                  className="danger"
                  onClick={() => handleDelete(m)}
                  disabled={pendingId === m.id}
                >
                  {pendingId === m.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className={styles.emptyCard}>
      <h2>No movies yet</h2>
      <p>Log the first movie you&apos;ve watched to get started.</p>
      <button className="primary" onClick={onAdd}>
        + Add your first movie
      </button>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-label={`${value} of 5 stars`}>
      {"★".repeat(value)}
      <span className={styles.starsDim}>{"★".repeat(5 - value)}</span>
    </span>
  );
}
