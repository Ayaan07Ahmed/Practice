"use server";

export type TmdbResult = {
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
  overview: string | null;
};

export type SearchResponse = {
  results: TmdbResult[];
  error?: string;
};

type TmdbApiMovie = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  poster_path: string | null;
  overview?: string | null;
};

const ENDPOINT = "https://api.themoviedb.org/3/search/movie";
const TIMEOUT_MS = 5000;

export async function searchMovies(query: string): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { results: [] };

  const token = process.env.TMDB_API_KEY;
  if (!token) {
    return { results: [], error: "TMDB key not configured" };
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("query", trimmed);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return { results: [] };
    const data = (await res.json()) as { results?: TmdbApiMovie[] };
    const results = (data.results ?? []).slice(0, 6).map(toTmdbResult);
    return { results };
  } catch {
    return { results: [] };
  } finally {
    clearTimeout(timer);
  }
}

function toTmdbResult(m: TmdbApiMovie): TmdbResult {
  const yearMatch = m.release_date?.match(/^(\d{4})/);
  return {
    tmdb_id: m.id,
    title: m.title ?? m.name ?? "",
    year: yearMatch ? Number(yearMatch[1]) : null,
    poster_path: m.poster_path,
    overview: m.overview && m.overview.trim().length > 0 ? m.overview : null,
  };
}

const TRENDING_ENDPOINT = "https://api.themoviedb.org/3/trending/movie/week";

export async function getTrending(): Promise<SearchResponse> {
  const token = process.env.TMDB_API_KEY;
  if (!token) return { results: [], error: "TMDB key not configured" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${TRENDING_ENDPOINT}?language=en-US`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return { results: [] };
    const data = (await res.json()) as { results?: TmdbApiMovie[] };
    return { results: (data.results ?? []).slice(0, 20).map(toTmdbResult) };
  } catch {
    return { results: [] };
  } finally {
    clearTimeout(timer);
  }
}
