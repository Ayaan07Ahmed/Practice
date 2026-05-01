"use client";

import Link from "next/link";
import type { TmdbResult } from "@/app/(authenticated)/movies/tmdb";
import { posterUrl } from "@/app/(authenticated)/movies/poster";
import styles from "./TmdbDetail.module.css";

type Props = {
  result: TmdbResult;
  onClose: () => void;
};

export default function TmdbDetail({ result, onClose }: Props) {
  const params = new URLSearchParams({
    add: "1",
    tmdb_id: String(result.tmdb_id),
    title: result.title,
    year: result.year !== null ? String(result.year) : "",
    poster_path: result.poster_path ?? "",
    overview: (result.overview ?? "").slice(0, 500),
  });
  const baseHref = `/movies?${params.toString()}`;
  const posterUrlLarge = posterUrl(result.poster_path, "w342");

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{result.title}</h2>
        {result.year !== null && <span className={styles.year}>{result.year}</span>}
      </header>

      <div className={styles.body}>
        <div className={styles.posterWrap}>
          {posterUrlLarge ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={posterUrlLarge} alt={`${result.title} poster`} className={styles.poster} />
          ) : (
            <div className={styles.posterPlaceholder}>🎬</div>
          )}
        </div>
        <div className={styles.content}>
          {result.overview ? (
            <section>
              <h3 className={styles.sectionTitle}>Description</h3>
              <p className={styles.overview}>{result.overview}</p>
            </section>
          ) : (
            <p className={styles.empty}>No description available.</p>
          )}
        </div>
      </div>

      <footer className={styles.actions}>
        <button type="button" onClick={onClose}>← Back</button>
        <div className={styles.spacer} />
        <Link className={styles.actionBtn} href={`${baseHref}&status=watchlist`}>
          + Watchlist
        </Link>
        <Link className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} href={`${baseHref}&status=watched`}>
          + Watched
        </Link>
      </footer>
    </article>
  );
}
