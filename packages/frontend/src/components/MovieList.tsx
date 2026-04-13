import { useMovies } from "../hooks/useMovies";
import { MovieCard } from "./MovieCard";

export function MovieList() {
  const { data: movies, isLoading } = useMovies();

  if (isLoading) {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="poster" />
            <div className="body">
              <div className="skeleton-line w-70" />
              <div className="skeleton-line w-90" />
              <div className="skeleton-line w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!movies?.length) return <div className="loading">No movies showing.</div>;

  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard key={movie.movie_id} movie={movie} />
      ))}
    </div>
  );
}
