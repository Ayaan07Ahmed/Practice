"use client";

import { useState, useTransition } from "react";
import { markAsWatched } from "@/app/(authenticated)/movies/actions";
import styles from "./MarkWatchedButton.module.css";

export default function MarkWatchedButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(4);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await markAsWatched(id, rating);
      if (res.error) setError(res.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button type="button" className="primary" onClick={() => setOpen(true)}>
        Mark watched
      </button>
    );
  }

  return (
    <div className={styles.prompt}>
      <div className={styles.title}>Rate &ldquo;{title}&rdquo;</div>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} stars`}
            className={`${styles.starBtn} ${n <= rating ? styles.starOn : ""}`}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      <div className={styles.actions}>
        <button type="button" onClick={() => setOpen(false)} disabled={isPending}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={submit} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
