"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(name: string): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 50)
    return { error: "Display name must be 1–50 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: trimmed },
  });

  if (error) return { error: error.message };

  // Revalidate from root with type:'layout' so the (authenticated) layout
  // re-renders and the sidebar's user card picks up the new name.
  revalidatePath("/", "layout");
  return {};
}
