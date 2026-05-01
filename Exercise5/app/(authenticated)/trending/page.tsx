import { getTrending } from "@/app/(authenticated)/movies/tmdb";
import PosterGrid from "@/app/components/PosterGrid";

export default async function TrendingPage() {
  const { results, error } = await getTrending();

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.4rem" }}>🔥 Trending this week</h2>
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}
      <PosterGrid results={results} />
    </div>
  );
}
