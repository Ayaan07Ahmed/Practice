export type Movie = {
  id: string;
  user_id: string;
  title: string;
  year: number | null;
  rating: number;
  notes: string | null;
  watched_on: string | null; // ISO date string (YYYY-MM-DD)
  created_at: string;
};

export type MovieInput = {
  title: string;
  year: number | null;
  rating: number;
  notes: string | null;
  watched_on: string | null;
};
