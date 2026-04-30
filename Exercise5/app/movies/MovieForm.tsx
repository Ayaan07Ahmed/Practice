"use client";

import { useState, useTransition } from "react";
import type { Movie, MovieInput } from "./types";
import { createMovie, updateMovie } from "./actions";
import styles from "./MovieForm.module.css";

type Props =
  | { mode: "create"; onClose: () => void; initial?: undefined }
  | { mode: "edit"; onClose: () => void; initial: Movie };

export default function MovieForm({ mode, onClose, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [rating, setRating] = useState<number>(initial?.rating ?? 4);
  const [watchedOn, setWatchedOn] = useState(initial?.watched_on ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tmdbId] = useState<number | null>(initial?.tmdb_id ?? null);
  const [posterPath] = useState<string | null>(initial?.poster_path ?? null);
  const [overview] = useState<string | null>(initial?.overview ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 200) {
      setError("Title must be 1–200 characters.");
      return;
    }
    const yearNum = year.trim() === "" ? null : Number(year);
    if (yearNum !== null && (!Number.isInteger(yearNum) || yearNum < 1888)) {
      setError("Year must be a whole number ≥ 1888 (or blank).");
      return;
    }
    if (notes.length > 2000) {
      setError("Notes must be 2000 characters or fewer.");
      return;
    }

    const input: MovieInput = {
      title: trimmedTitle,
      year: yearNum,
      rating,
      notes: notes.trim() === "" ? null : notes,
      watched_on: watchedOn === "" ? null : watchedOn,
      tmdb_id: tmdbId,
      poster_path: posterPath,
      overview,
    };

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createMovie(input)
          : await updateMovie(initial.id, input);
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h2 className={styles.title}>
        {mode === "create" ? "Add movie" : "Edit movie"}
      </h2>

      {error && <div className="error">{error}</div>}

      <label className={styles.field}>
        <span>Title <em>required</em></span>
        <input
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Year</span>
          <input
            type="number"
            inputMode="numeric"
            min={1888}
            max={new Date().getFullYear() + 5}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2024"
          />
        </label>

        <label className={styles.field}>
          <span>Watched on</span>
          <input
            type="date"
            value={watchedOn}
            onChange={(e) => setWatchedOn(e.target.value)}
          />
        </label>
      </div>

      <fieldset className={styles.ratingField}>
        <legend>Rating <em>required</em></legend>
        <div className={styles.starPicker} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              className={`${styles.starBtn} ${n <= rating ? styles.starOn : ""}`}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
          <span className={styles.ratingLabel}>{rating} / 5</span>
        </div>
      </fieldset>

      <label className={styles.field}>
        <span>Notes</span>
        <textarea
          maxLength={2000}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you think?"
        />
      </label>

      <div className={styles.actions}>
        <button type="button" onClick={onClose} disabled={isPending}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={isPending}>
          {isPending
            ? mode === "create" ? "Adding…" : "Saving…"
            : mode === "create" ? "Add movie" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
