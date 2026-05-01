"use client";

import { useState, useTransition } from "react";
import type { Movie } from "./types";
import PosterImage from "./PosterImage";
import styles from "./MovieView.module.css";

type Props = {
  movie: Movie;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  isDeleting: boolean;
  onMarkWatched?: (rating: number) => Promise<void>;
};

export default function MovieView({
  movie,
  onEdit,
  onDelete,
  onClose,
  isDeleting,
  onMarkWatched,
}: Props) {
  const [marking, setMarking] = useState(false);
  const [rating, setRating] = useState(4);
  const [markError, setMarkError] = useState<string | null>(null);
  const [isMarkPending, startMarkTransition] = useTransition();

  function handleMark() {
    if (!onMarkWatched) return;
    setMarkError(null);
    startMarkTransition(async () => {
      try {
        await onMarkWatched(rating);
      } catch (e) {
        setMarkError(e instanceof Error ? e.message : "Failed to save.");
      }
    });
  }

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{movie.title}</h2>
        <div className={styles.meta}>
          {movie.rating !== null && <Stars value={movie.rating} />}
          {movie.year !== null && (
            <span className={styles.year}>{movie.year}</span>
          )}
          {movie.watched_on && (
            <span className={styles.watched}>watched {movie.watched_on}</span>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.posterWrap}>
          <PosterImage
            posterPath={movie.poster_path}
            title={movie.title}
            size="w342"
            width={228}
            height={342}
          />
        </div>

        <div className={styles.content}>
          {movie.overview ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Description</h3>
              <p className={styles.text}>{movie.overview}</p>
            </section>
          ) : null}

          {movie.notes ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Notes</h3>
              <p className={`${styles.text} ${styles.notes}`}>{movie.notes}</p>
            </section>
          ) : null}

          {!movie.overview && !movie.notes && (
            <p className={styles.empty}>No description or notes for this movie.</p>
          )}
        </div>
      </div>

      {markError && <div className="error">{markError}</div>}

      <footer className={styles.actions}>
        {marking ? (
          <>
            <button
              type="button"
              onClick={() => {
                setMarking(false);
                setMarkError(null);
              }}
              disabled={isMarkPending}
            >
              Cancel
            </button>
            <div className={styles.markPicker}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`${styles.starBtn} ${n <= rating ? styles.starOn : ""}`}
                  onClick={() => setRating(n)}
                  aria-label={`${n} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            <button
              type="button"
              className="primary"
              onClick={handleMark}
              disabled={isMarkPending}
            >
              {isMarkPending ? "Saving…" : "Save"}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onClose} disabled={isDeleting}>
              ← Back
            </button>
            <div className={styles.spacer} />
            {onMarkWatched && (
              <button
                type="button"
                className="primary"
                onClick={() => setMarking(true)}
                disabled={isDeleting}
              >
                Mark watched
              </button>
            )}
            <button
              type="button"
              className="danger"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              className="primary"
              onClick={onEdit}
              disabled={isDeleting}
            >
              Edit
            </button>
          </>
        )}
      </footer>
    </article>
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
