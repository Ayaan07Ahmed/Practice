"use client";

import Image from "next/image";
import { posterUrl, type PosterSize } from "./poster";

export default function PosterImage({
  posterPath,
  title,
  size = "w92",
  width,
  height,
  className,
}: {
  posterPath: string | null;
  title: string;
  size?: PosterSize;
  width: number;
  height: number;
  className?: string;
}) {
  const url = posterUrl(posterPath, size);
  if (!url) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          display: "grid",
          placeItems: "center",
          background: "var(--panel-tint)",
          color: "var(--text-dim)",
          fontWeight: 600,
          borderRadius: "8px",
          fontSize: width >= 120 ? "1.4rem" : "1rem",
        }}
        aria-label={`No poster for ${title}`}
      >
        🌿{title.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      className={className}
      src={url}
      alt={`${title} poster`}
      width={width}
      height={height}
      style={{ borderRadius: "8px", objectFit: "cover" }}
      unoptimized={false}
    />
  );
}
