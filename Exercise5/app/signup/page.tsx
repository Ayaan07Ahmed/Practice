"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../login/auth.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    // If a session came back, email confirmation is disabled — sign-in
    // worked immediately. Otherwise we wait for the user to click the
    // confirmation link in their inbox.
    if (data.session) {
      router.push("/movies");
      router.refresh();
    } else {
      setConfirmationSent(true);
      setSubmitting(false);
    }
  }

  if (confirmationSent) {
    return (
      <main className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>🎬 Movie Tracker</h1>
          <p className={styles.subtitle}>Check your email</p>
          <p style={{ color: "var(--text-dim)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating your account, then come back and sign in.
          </p>
          <p className={styles.hint}>
            <Link href="/login">Back to sign in</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>🎬 Movie Tracker</h1>
        <p className={styles.subtitle}>Create an account</p>

        {error && <div className="error">{error}</div>}

        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>

        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create account"}
        </button>

        <p className={styles.hint}>
          Already have one? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
