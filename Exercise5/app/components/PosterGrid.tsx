"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { TmdbResult } from "@/app/(authenticated)/movies/tmdb";
import { posterUrl } from "@/app/(authenticated)/movies/poster";
import styles from "./PosterGrid.module.css";

type Props = { results: TmdbResult[] };

export default function PosterGrid({ results }: Props) {
  const sorted = useMemo(() => results, [results]);

  if (sorted.length === 0) {
    return <p className={styles.empty}>No results.</p>;
  }

  return (
    <ul className={styles.grid}>
      {sorted.map((r) => {
        const url = posterUrl(r.poster_path, "w342");
        const params = new URLSearchParams({
          add: "1",
          tmdb_id: String(r.tmdb_id),
          title: r.title,
          year: r.year !== null ? String(r.year) : "",
          poster_path: r.poster_path ?? "",
          overview: r.overview ?? "",
        });
        const baseHref = `/movies?${params.toString()}`;
        return (
          <li key={r.tmdb_id} className={styles.card}>
            <div className={styles.poster}>
              {url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt={`${r.title} poster`} />
              ) : (
                <div className={styles.placeholder}>🎬</div>
              )}
            </div>
            <div className={styles.body}>
              <span className={styles.title} title={r.title}>{r.title}</span>
              {r.year !== null && <span className={styles.year}>{r.year}</span>}
              <div className={styles.actions}>
                <Link className={styles.actionBtn} href={`${baseHref}&status=watchlist`}>
                  + Watchlist
                </Link>
                <Link className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} href={`${baseHref}&status=watched`}>
                  + Watched
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
