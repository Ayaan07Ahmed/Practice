import { discoverByGenre } from "@/app/(authenticated)/movies/tmdb";
import PosterGrid from "@/app/components/PosterGrid";

export default async function GenrePage({
  params,
  searchParams,
}: {
  params: Promise<{ genreId: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { genreId } = await params;
  const sp = await searchParams;
  const id = Number(genreId);
  const { results, error } = Number.isInteger(id) && id > 0
    ? await discoverByGenre(id)
    : { results: [], error: "Invalid genre id" };

  return (
    <div style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.4rem" }}>
        🎭 {sp.name ?? "Genre"}
      </h2>
      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}
      <PosterGrid results={results} />
    </div>
  );
}
