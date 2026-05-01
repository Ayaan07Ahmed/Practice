import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/app/components/Sidebar";
import styles from "./layout.module.css";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName =
    typeof user.user_metadata?.display_name === "string" &&
    user.user_metadata.display_name.trim().length > 0
      ? user.user_metadata.display_name.trim()
      : user.email ?? "Account";

  return (
    <>
      <header className={styles.navBar}>
        <div className={styles.navBarInner}>
          <h1 className={styles.title}>🎬 Movie Tracker</h1>
        </div>
      </header>
      <Sidebar displayName={displayName} email={user.email} />
      <main className={styles.main}>{children}</main>
    </>
  );
}
