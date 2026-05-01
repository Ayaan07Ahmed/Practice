"use client";

import { useState } from "react";
import type { TmdbResult } from "@/app/(authenticated)/movies/tmdb";
import { posterUrl } from "@/app/(authenticated)/movies/poster";
import TmdbDetail from "./TmdbDetail";
import styles from "./PosterGrid.module.css";

type Props = { results: TmdbResult[] };

export default function PosterGrid({ results }: Props) {
  const [viewing, setViewing] = useState<TmdbResult | null>(null);

  if (viewing) {
    return <TmdbDetail result={viewing} onClose={() => setViewing(null)} />;
  }

  if (results.length === 0) {
    return <p className={styles.empty}>No results.</p>;
  }

  return (
    <ul className={styles.grid}>
      {results.map((r) => {
        const url = posterUrl(r.poster_path, "w342");
        return (
          <li
            key={r.tmdb_id}
            className={styles.card}
            onClick={() => setViewing(r)}
            title={r.overview ?? undefined}
          >
            <div className={styles.poster}>
              {url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt={`${r.title} poster`} loading="lazy" width="342" height="513" />
              ) : (
                <div className={styles.placeholder}>🎬</div>
              )}
            </div>
            <div className={styles.body}>
              <span className={styles.title} title={r.title}>{r.title}</span>
              <span className={styles.year}>{r.year !== null ? r.year : " "}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
