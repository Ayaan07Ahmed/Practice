export type Status = "watched" | "watchlist";

export type Movie = {
  id: string;
  user_id: string;
  title: string;
  year: number | null;
  rating: number | null;
  notes: string | null;
  watched_on: string | null;
  created_at: string;
  tmdb_id: number | null;
  poster_path: string | null;
  overview: string | null;
  status: Status;
};

export type MovieInput = {
  title: string;
  year: number | null;
  rating: number | null;
  notes: string | null;
  watched_on: string | null;
  tmdb_id: number | null;
  poster_path: string | null;
  overview: string | null;
  status: Status;
};
