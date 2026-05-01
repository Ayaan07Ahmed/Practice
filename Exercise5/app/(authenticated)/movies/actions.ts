"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MovieInput } from "./types";

const CURRENT_YEAR = new Date().getFullYear();

type ActionResult = { error?: string };

const POSTER_PATH_RE = /^\/[A-Za-z0-9_./-]+$/;
const VALID_STATUSES = new Set(["watched", "watchlist"]);

// Mirrors movies_rating_check in supabase/migrations/2026-05-01-watchlist.sql.
// Keep these in sync — Postgres will reject mismatched writes either way,
// but matching them lets the UI surface a friendly error first.
function validate(input: MovieInput): string | null {
  const title = input.title?.trim() ?? "";
  if (title.length < 1 || title.length > 200) return "Title must be 1–200 characters.";
  if (!VALID_STATUSES.has(input.status)) return "Invalid status.";
  if (input.status === "watched") {
    if (
      input.rating === null ||
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      return "Rating must be between 1 and 5 for watched movies.";
    }
  } else {
    if (input.rating !== null) return "Watchlist entries must not have a rating.";
  }
  if (input.year !== null) {
    if (!Number.isInteger(input.year) || input.year < 1888 || input.year > CURRENT_YEAR + 5)
      return `Year must be between 1888 and ${CURRENT_YEAR + 5}.`;
  }
  if (input.notes !== null && input.notes.length > 2000)
    return "Notes must be 2000 characters or fewer.";
  if (input.tmdb_id !== null && !Number.isInteger(input.tmdb_id))
    return "Invalid TMDB id.";
  if (input.poster_path !== null) {
    if (input.poster_path.length > 200 || !POSTER_PATH_RE.test(input.poster_path))
      return "Invalid poster path.";
  }
  if (input.overview !== null && input.overview.length > 4000)
    return "Overview must be 4000 characters or fewer.";
  return null;
}

function normalize(input: MovieInput): MovieInput {
  return {
    title: input.title.trim(),
    year: input.year,
    rating: input.rating,
    notes: input.notes && input.notes.trim().length > 0 ? input.notes.trim() : null,
    watched_on: input.watched_on && input.watched_on.length > 0 ? input.watched_on : null,
    tmdb_id: input.tmdb_id,
    poster_path: input.poster_path,
    overview: input.overview && input.overview.trim().length > 0 ? input.overview.trim() : null,
    status: input.status,
  };
}

export async function createMovie(input: MovieInput): Promise<ActionResult> {
  const v = validate(input);
  if (v) return { error: v };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("movies")
    .insert({ ...normalize(input), user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath("/movies");
  return {};
}

export async function updateMovie(id: string, input: MovieInput): Promise<ActionResult> {
  const v = validate(input);
  if (v) return { error: v };

  const supabase = await createClient();
  const { error } = await supabase
    .from("movies")
    .update(normalize(input))
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/movies");
  return {};
}

export async function deleteMovie(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("movies").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/movies");
  return {};
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function markAsWatched(
  id: string,
  rating: number,
  watchedOn: string,
): Promise<ActionResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "Rating must be between 1 and 5." };
  if (!ISO_DATE_RE.test(watchedOn))
    return { error: "Invalid date." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("movies")
    .update({ status: "watched", rating, watched_on: watchedOn })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/movies");
  revalidatePath("/watchlist");
  return {};
}
