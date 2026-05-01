"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchMovies, type TmdbResult } from "./tmdb";
import { posterUrl } from "./poster";
import styles from "./TmdbCombobox.module.css";

type Props = {
  value: string;
  onTextChange: (text: string) => void;
  onSelect: (result: TmdbResult) => void;
  autoFocus?: boolean;
};

export default function TmdbCombobox({
  value,
  onTextChange,
  onSelect,
  autoFocus,
}: Props) {
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultsForQuery, setResultsForQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownId = useId();

  // Debounced fetch on value change. All setState calls happen inside the
  // async timeout callback — never synchronously in the effect body — to
  // satisfy Next.js 16's react-hooks/set-state-in-effect rule.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) return;

    let cancelled = false;
    const handle = setTimeout(async () => {
      const res = await searchMovies(q);
      if (cancelled) return;
      if (res.error) {
        setErrorMsg(res.error);
        setResults([]);
      } else {
        setErrorMsg(null);
        setResults(res.results);
      }
      setResultsForQuery(q);
      setHighlight(0);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Derived state — only show fetched data when it matches the current query.
  const trimmedValue = value.trim();
  const queryMatches = trimmedValue === resultsForQuery;
  const visibleResults = queryMatches ? results : [];
  const visibleError = queryMatches ? errorMsg : null;
  const loading = trimmedValue.length >= 2 && !queryMatches && visibleError === null;

  const showManualRow = visibleResults.length > 0;
  const lastIndex = showManualRow ? visibleResults.length : visibleResults.length - 1;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, lastIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (visibleResults.length === 0) return;
      e.preventDefault();
      if (highlight < visibleResults.length) {
        onSelect(visibleResults[highlight]);
      }
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const dropdownVisible = open && trimmedValue.length >= 2;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => {
          onTextChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        autoComplete="off"
        required
        maxLength={200}
        role="combobox"
        aria-expanded={dropdownVisible}
        aria-controls={dropdownId}
        aria-autocomplete="list"
      />
      {loading && <span className={styles.spinner} aria-hidden="true" />}

      {dropdownVisible && (
        <ul id={dropdownId} className={styles.dropdown} role="listbox">
          {visibleError && <li className={styles.error}>{visibleError}</li>}
          {!loading && !visibleError && visibleResults.length === 0 && (
            <li className={styles.empty}>No suggestions</li>
          )}
          {visibleResults.map((r, i) => {
            const url = posterUrl(r.poster_path, "w92");
            return (
              <li
                key={r.tmdb_id}
                role="option"
                aria-selected={i === highlight}
                className={`${styles.row} ${i === highlight ? styles.highlight : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(r);
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlight(i)}
              >
                <span className={styles.thumb}>
                  {url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={url} alt="" />
                  ) : (
                    "🎬"
                  )}
                </span>
                <span className={styles.info}>
                  <span className={styles.title}>{r.title}</span>
                  {r.year !== null && <span className={styles.year}>{r.year}</span>}
                </span>
              </li>
            );
          })}
          {showManualRow && (
            <li
              role="option"
              aria-selected={highlight === visibleResults.length}
              className={`${styles.row} ${styles.manual} ${
                highlight === visibleResults.length ? styles.highlight : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              onMouseEnter={() => setHighlight(visibleResults.length)}
            >
              Use &ldquo;{value}&rdquo; without TMDB match
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
