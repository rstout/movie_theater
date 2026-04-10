import { useMovies } from "../hooks/useMovies";
import { MovieCard } from "./MovieCard";

export function MovieList() {
  const { data: movies, isLoading } = useMovies();

  if (isLoading) return <div className="loading">Loading movies...</div>;
  if (!movies?.length) return <div className="loading">No movies showing.</div>;

  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard key={movie.movie_id} movie={movie} />
      ))}
    </div>
  );
}
