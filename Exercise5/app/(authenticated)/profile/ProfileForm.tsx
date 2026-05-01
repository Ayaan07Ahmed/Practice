"use client";

import { useState, useTransition } from "react";
import { updateDisplayName } from "./actions";
import styles from "./profile.module.css";

export default function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateDisplayName(name);
      if (res.error) setError(res.error);
      else setSavedAt(Date.now());
    });
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      {error && <div className="error">{error}</div>}
      <label className={styles.field}>
        <span>Display name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSavedAt(null);
            setError(null);
          }}
          required
          minLength={1}
          maxLength={50}
        />
      </label>
      <div className={styles.actions}>
        {savedAt !== null && !isPending && (
          <span className={styles.savedBadge}>Saved.</span>
        )}
        <button type="submit" className="primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
