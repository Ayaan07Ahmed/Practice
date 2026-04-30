"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MovieInput } from "./types";

const CURRENT_YEAR = new Date().getFullYear();

type ActionResult = { error?: string };

function validate(input: MovieInput): string | null {
  const title = input.title?.trim() ?? "";
  if (title.length < 1 || title.length > 200) return "Title must be 1–200 characters.";
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)
    return "Rating must be between 1 and 5.";
  if (input.year !== null) {
    if (!Number.isInteger(input.year) || input.year < 1888 || input.year > CURRENT_YEAR + 5)
      return `Year must be between 1888 and ${CURRENT_YEAR + 5}.`;
  }
  if (input.notes !== null && input.notes.length > 2000)
    return "Notes must be 2000 characters or fewer.";
  return null;
}

function normalize(input: MovieInput): MovieInput {
  return {
    title: input.title.trim(),
    year: input.year,
    rating: input.rating,
    notes: input.notes && input.notes.trim().length > 0 ? input.notes.trim() : null,
    watched_on: input.watched_on && input.watched_on.length > 0 ? input.watched_on : null,
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
