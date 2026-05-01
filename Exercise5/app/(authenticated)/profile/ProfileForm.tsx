"use client";

import { useState, useTransition } from "react";
import { updateDisplayName } from "./actions";

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
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {error && <div className="error">{error}</div>}
      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem" }}>
        <span style={{ fontWeight: 600, color: "var(--text)", textShadow: "var(--text-emboss-light)" }}>Display name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={50}
        />
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", alignItems: "center" }}>
        {savedAt !== null && !isPending && (
          <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>Saved.</span>
        )}
        <button type="submit" className="primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
