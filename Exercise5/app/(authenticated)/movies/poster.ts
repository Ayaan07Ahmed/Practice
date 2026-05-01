// app/movies/poster.ts
export type PosterSize = "w92" | "w342";

export function posterUrl(
  path: string | null | undefined,
  size: PosterSize = "w92",
): string | null {
  if (!path) return null;
  const trimmed = path.replace(/^\//, "");
  return `https://image.tmdb.org/t/p/${size}/${trimmed}`;
}
