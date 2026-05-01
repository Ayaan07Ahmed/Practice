import Link from "next/link";
import { getGenres } from "@/app/(authenticated)/movies/tmdb";
import styles from "./discover.module.css";

export default async function DiscoverPage() {
  const { genres, error } = await getGenres();

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>🎭 Browse by genre</h2>
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}
      <ul className={styles.grid}>
        {genres.map((g) => (
          <li key={g.id}>
            <Link className={styles.tile} href={`/discover/${g.id}?name=${encodeURIComponent(g.name)}`}>
              {g.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
