import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MovieList from "./MovieList";
import type { Movie } from "./types";
import styles from "./page.module.css";

export default async function MoviesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .order("watched_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>🎬 Movie Tracker</h1>
        <div className={styles.userBar}>
          <span className={styles.email}>{user.email}</span>
          <form action="/auth/signout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>

      {error ? (
        <div className="error">Failed to load movies: {error.message}</div>
      ) : (
        <MovieList initialMovies={(data ?? []) as Movie[]} />
      )}
    </main>
  );
}
