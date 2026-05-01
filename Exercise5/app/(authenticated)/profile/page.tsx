import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";
import styles from "./profile.module.css";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const initialName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : "";

  const [{ count: watchedCount }, { count: watchlistCount }] = await Promise.all([
    supabase.from("movies").select("*", { count: "exact", head: true }).eq("status", "watched"),
    supabase.from("movies").select("*", { count: "exact", head: true }).eq("status", "watchlist"),
  ]);

  const joined = new Date(user.created_at).toLocaleDateString();

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>👤 Profile</h2>

      <div className={styles.card}>
        <ProfileForm initialName={initialName} />
      </div>

      <div className={styles.card}>
        <dl className={styles.facts}>
          <dt className={styles.factLabel}>Email</dt>
          <dd className={styles.factValue}>{user.email}</dd>
          <dt className={styles.factLabel}>Joined</dt>
          <dd className={styles.factValue}>{joined}</dd>
          <dt className={styles.factLabel}>Movies watched</dt>
          <dd className={styles.factValue}>{watchedCount ?? 0}</dd>
          <dt className={styles.factLabel}>On watchlist</dt>
          <dd className={styles.factValue}>{watchlistCount ?? 0}</dd>
        </dl>
      </div>
    </div>
  );
}
