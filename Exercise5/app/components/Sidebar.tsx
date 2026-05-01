"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { href: "/movies", label: "Movies", icon: "🎞️" },
  { href: "/watchlist", label: "Watchlist", icon: "⭐" },
  { href: "/trending", label: "Trending", icon: "🔥" },
  { href: "/discover", label: "Discover", icon: "🎭" },
  { href: "/stats", label: "Stats", icon: "📊" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

type Props = {
  displayName: string;
  email: string | undefined;
};

export default function Sidebar({ displayName, email }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Auto-close when widening past mobile breakpoint
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 720) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close on browser back/forward navigation
  useEffect(() => {
    function onPop() {
      setOpen(false);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Lock body scroll while the drawer is open on mobile
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.hamburger}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div
          className={styles.backdrop}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.brand}>🎬 Movie Tracker</div>

        <nav className={styles.nav} aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${active ? styles.active : ""}`}
                onClick={() => setOpen(false)}
              >
                <span className={styles.icon}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.spacer} />

        <div className={styles.user}>
          <div className={styles.userName}>{displayName}</div>
          {email && email !== displayName && (
            <div className={styles.userEmail}>{email}</div>
          )}
        </div>

        <form action="/auth/signout" method="post" className={styles.signoutForm}>
          <button type="submit" className={styles.signout}>
            Sign out
          </button>
        </form>
      </aside>
    </>
  );
}
