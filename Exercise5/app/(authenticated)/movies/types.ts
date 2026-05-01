export type Movie = {
  id: string;
  user_id: string;
  title: string;
  year: number | null;
  rating: number;
  notes: string | null;
  watched_on: string | null; // ISO date string (YYYY-MM-DD)
  created_at: string;
  tmdb_id: number | null;
  poster_path: string | null;
  overview: string | null;
};

export type MovieInput = {
  title: string;
  year: number | null;
  rating: number;
  notes: string | null;
  watched_on: string | null;
  tmdb_id: number | null;
  poster_path: string | null;
  overview: string | null;
};
