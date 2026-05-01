"use client";

import { useState, useTransition } from "react";
import type { Movie, MovieInput } from "./types";
import type { TmdbResult } from "./tmdb";
import { createMovie, updateMovie } from "./actions";
import TmdbCombobox from "./TmdbCombobox";
import styles from "./MovieForm.module.css";

type Props =
  | { mode: "create"; onClose: () => void; initial?: undefined }
  | { mode: "edit"; onClose: () => void; initial: Movie };

export default function MovieForm({ mode, onClose, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [rating, setRating] = useState<number | null>(initial?.rating ?? 4);
  const [status, setStatus] = useState<"watched" | "watchlist">(
    initial?.status ?? "watched",
  );
  const [watchedOn, setWatchedOn] = useState(initial?.watched_on ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tmdbId, setTmdbId] = useState<number | null>(initial?.tmdb_id ?? null);
  const [posterPath, setPosterPath] = useState<string | null>(
    initial?.poster_path ?? null,
  );
  const [overview, setOverview] = useState<string | null>(initial?.overview ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Any manual title edit drops the linked TMDB metadata, since the title
  // and metadata would otherwise drift apart.
  function handleTextChange(text: string) {
    setTitle(text);
    if (tmdbId !== null) {
      setTmdbId(null);
      setPosterPath(null);
      setOverview(null);
    }
  }

  function handleTmdbSelect(r: TmdbResult) {
    setTitle(r.title);
    setYear(r.year !== null ? r.year.toString() : "");
    setTmdbId(r.tmdb_id);
    setPosterPath(r.poster_path);
    setOverview(r.overview);
  }

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
    if (status === "watched") {
      if (rating === null || rating < 1 || rating > 5) {
        setError("Pick a rating from 1 to 5 for watched movies.");
        return;
      }
    }

    const input: MovieInput = {
      title: trimmedTitle,
      year: yearNum,
      rating: status === "watchlist" ? null : rating,
      notes: notes.trim() === "" ? null : notes,
      watched_on: watchedOn === "" ? null : watchedOn,
      tmdb_id: tmdbId,
      poster_path: posterPath,
      overview,
      status,
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
        <TmdbCombobox
          value={title}
          onTextChange={handleTextChange}
          onSelect={handleTmdbSelect}
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

      <fieldset className={styles.statusField}>
        <legend>Status</legend>
        <div className={styles.statusPicker} role="radiogroup">
          <label className={`${styles.statusOption} ${status === "watched" ? styles.statusOn : ""}`}>
            <input
              type="radio"
              name="status"
              value="watched"
              checked={status === "watched"}
              onChange={() => setStatus("watched")}
            />
            🎬 Watched
          </label>
          <label className={`${styles.statusOption} ${status === "watchlist" ? styles.statusOn : ""}`}>
            <input
              type="radio"
              name="status"
              value="watchlist"
              checked={status === "watchlist"}
              onChange={() => setStatus("watchlist")}
            />
            ⭐ Want to watch
          </label>
        </div>
      </fieldset>

      {status === "watched" && (
        <fieldset className={styles.ratingField}>
          <legend>Rating <em>required</em></legend>
          <div className={styles.starPicker} role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                role="radio"
                aria-checked={rating === n}
                className={`${styles.starBtn} ${rating !== null && n <= rating ? styles.starOn : ""}`}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
            <span className={styles.ratingLabel}>{rating ?? "—"} / 5</span>
          </div>
        </fieldset>
      )}

      <label className={styles.field}>
        <span>Description <em>auto-filled from TMDB, editable</em></span>
        <textarea
          maxLength={4000}
          rows={3}
          value={overview ?? ""}
          onChange={(e) => setOverview(e.target.value === "" ? null : e.target.value)}
          placeholder="Pick a TMDB suggestion to auto-fill, or type your own."
        />
      </label>

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
