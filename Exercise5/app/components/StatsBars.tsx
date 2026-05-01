"use client";

import styles from "./StatsBars.module.css";

type Bar = { label: string; count: number };

export default function StatsBars({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.count));
  return (
    <div>
      {bars.map((b) => {
        const pct = (b.count / max) * 100;
        return (
          <div key={b.label} className={styles.barRow}>
            <span className={styles.barLabel}>{b.label}</span>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.barCount}>{b.count}</span>
          </div>
        );
      })}
    </div>
  );
}
