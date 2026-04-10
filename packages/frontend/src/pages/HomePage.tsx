import { MovieList } from "../components/MovieList";

export function HomePage() {
  return (
    <>
      <h2 className="page-title">Now Showing</h2>
      <MovieList />
    </>
  );
}
