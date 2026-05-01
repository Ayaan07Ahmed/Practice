import { createClient } from "@/lib/supabase/server";
import type { Movie } from "@/app/(authenticated)/movies/types";
import StatsBars from "@/app/components/StatsBars";
import styles from "./stats.module.css";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "watched");

  const movies = (data ?? []) as Movie[];
  const total = movies.length;
  const avg =
    total === 0
      ? 0
      : movies.reduce((s, m) => s + (m.rating ?? 0), 0) / total;

  const ratingBars = [5, 4, 3, 2, 1].map((n) => ({
    label: "★".repeat(n),
    count: movies.filter((m) => m.rating === n).length,
  }));

  const yearCounts = new Map<string, number>();
  for (const m of movies) {
    if (!m.watched_on) continue;
    const year = m.watched_on.slice(0, 4);
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }
  const yearBars = [...yearCounts.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)
    .map(([y, c]) => ({ label: y, count: c }));

  const topRated = [...movies]
    .filter((m) => m.rating !== null)
    .sort((a, b) =>
      (b.rating ?? 0) - (a.rating ?? 0) ||
      a.title.localeCompare(b.title),
    )
    .slice(0, 5);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>📊 Your stats</h2>

      {error && <div className="error">{error.message}</div>}

      <div className={styles.bigNumbers}>
        <div className={styles.bigCard}>
          <div className={styles.bigLabel}>Movies watched</div>
          <div className={styles.bigValue}>{total}</div>
        </div>
        <div className={styles.bigCard}>
          <div className={styles.bigLabel}>Average rating</div>
          <div className={styles.bigValue}>{total === 0 ? "—" : avg.toFixed(2)}</div>
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Ratings distribution</h3>
        {total === 0 ? (
          <p className={styles.empty}>No movies yet.</p>
        ) : (
          <StatsBars bars={ratingBars} />
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Movies per year (last 10)</h3>
        {yearBars.length === 0 ? (
          <p className={styles.empty}>No watched-on dates recorded.</p>
        ) : (
          <StatsBars bars={yearBars} />
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Top 5</h3>
        {topRated.length === 0 ? (
          <p className={styles.empty}>No rated movies yet.</p>
        ) : (
          <ul className={styles.topList}>
            {topRated.map((m) => (
              <li key={m.id} className={styles.topRow}>
                <span className={styles.topRating}>{"★".repeat(m.rating ?? 0)}</span>
                <span>{m.title}</span>
                {m.year !== null && <span className={styles.topYear}>({m.year})</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
