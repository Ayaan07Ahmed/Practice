"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Movie } from "./types";
import { deleteMovie } from "./actions";
import MovieForm from "./MovieForm";
import MovieView from "./MovieView";
import PosterImage from "./PosterImage";
import ViewToggle, { type ViewMode } from "./ViewToggle";
import styles from "./MovieList.module.css";

type SortKey = "watched_desc" | "rating_desc" | "title_asc";

const VIEW_KEY = "movie-tracker.viewMode";

export default function MovieList({
  initialMovies,
  prefill,
}: {
  initialMovies: Movie[];
  prefill?: Partial<import("./types").MovieInput> | null;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("watched_desc");
  const [minRating, setMinRating] = useState<number>(0);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "list";
    try {
      const v = window.localStorage.getItem(VIEW_KEY);
      return v === "list" || v === "grid" ? v : "list";
    } catch {
      return "list";
    }
  });

  const [isAddingExplicit, setIsAddingExplicit] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [viewing, setViewing] = useState<Movie | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const router = useRouter();
  const [pendingPrefill, setPendingPrefill] = useState<typeof prefill>(prefill ?? null);

  // Strip prefill params from the URL on mount so a refresh doesn't reopen the form.
  // No setState in this effect body — `isAdding` is derived from `pendingPrefill` below.
  useEffect(() => {
    if (pendingPrefill) {
      router.replace("/movies");
    }
  }, [pendingPrefill, router]);

  const isAdding = isAddingExplicit || pendingPrefill !== null;

  function setViewMode(next: ViewMode) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // ignore
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = initialMovies;
    if (q) list = list.filter((m) => m.title.toLowerCase().includes(q));
    if (minRating > 0) list = list.filter((m) => (m.rating ?? 0) >= minRating);
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "rating_desc") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "title_asc") return a.title.localeCompare(b.title);
      const aw = a.watched_on ?? "";
      const bw = b.watched_on ?? "";
      if (aw === bw) return b.created_at.localeCompare(a.created_at);
      if (!aw) return 1;
      if (!bw) return -1;
      return bw.localeCompare(aw);
    });
    return sorted;
  }, [initialMovies, search, sort, minRating]);

  function handleDelete(movie: Movie, onSuccess?: () => void) {
    if (!confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;
    setError(null);
    setPendingId(movie.id);
    startTransition(async () => {
      const res = await deleteMovie(movie.id);
      setPendingId(null);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess?.();
      }
    });
  }

  if (isAdding) {
    return (
      <MovieForm
        mode="create"
        prefill={pendingPrefill ?? undefined}
        onClose={() => {
          setIsAddingExplicit(false);
          setPendingPrefill(null);
        }}
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
  if (viewing) {
    return (
      <MovieView
        key={viewing.id}
        movie={viewing}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
        }}
        onDelete={() => handleDelete(viewing, () => setViewing(null))}
        onClose={() => setViewing(null)}
        isDeleting={pendingId === viewing.id}
      />
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.toolbar}>
        <button className="primary" onClick={() => setIsAddingExplicit(true)}>
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
          <ViewToggle value={view} onChange={setViewMode} />
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {initialMovies.length === 0 ? (
        <EmptyState onAdd={() => setIsAddingExplicit(true)} />
      ) : visible.length === 0 ? (
        <p className={styles.empty}>No movies match your filters.</p>
      ) : view === "grid" ? (
        <ul className={styles.grid}>
          {visible.map((m) => (
            <li
              key={m.id}
              className={styles.card}
              onClick={() => setViewing(m)}
              title={m.overview ?? undefined}
            >
              <div className={styles.cardPoster}>
                <PosterImage
                  posterPath={m.poster_path}
                  title={m.title}
                  size="w342"
                  width={342}
                  height={513}
                />
                {m.rating !== null && (
                  <span className={styles.cardRating}>
                    {"★".repeat(m.rating)}
                  </span>
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{m.title}</span>
                <span className={styles.cardYear}>
                  {m.year !== null ? m.year : " "}
                </span>
              </div>
              <button
                type="button"
                className={styles.cardDelete}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(m);
                }}
                disabled={pendingId === m.id}
                aria-label={`Delete ${m.title}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.list}>
          {visible.map((m) => (
            <li
              key={m.id}
              className={styles.row}
              onClick={() => setViewing(m)}
            >
              <div className={styles.thumbInRow}>
                <PosterImage
                  posterPath={m.poster_path}
                  title={m.title}
                  size="w92"
                  width={60}
                  height={90}
                />
              </div>
              <div className={styles.rowMain}>
                <div className={styles.rowHeader}>
                  {m.rating !== null && <Stars value={m.rating} />}
                  <strong className={styles.rowTitle}>{m.title}</strong>
                  {m.year !== null && <span className={styles.year}>({m.year})</span>}
                  {m.watched_on && <span className={styles.date}>{m.watched_on}</span>}
                </div>
                {m.overview && <p className={styles.overview}>{m.overview}</p>}
                {m.notes && <p className={styles.notes}>“{m.notes}”</p>}
              </div>
              <div className={styles.rowActions}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(m);
                  }}
                  disabled={pendingId === m.id}
                >
                  Edit
                </button>
                <button
                  className="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(m);
                  }}
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
