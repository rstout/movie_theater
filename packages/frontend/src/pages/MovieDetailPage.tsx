import { useParams, Link } from "react-router-dom";
import { useMovies } from "../hooks/useMovies";
import { ShowtimeSelector } from "../components/ShowtimeSelector";

export function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>();
  const { data: movies, isLoading } = useMovies();

  if (isLoading) return <div className="loading">Loading...</div>;

  const movie = movies?.find((m) => m.movie_id === movieId);
  if (!movie) return <div className="loading">Movie not found.</div>;

  return (
    <>
      <Link to="/" className="back-link">
        &larr; Back to movies
      </Link>
      <h2 className="page-title">{movie.title}</h2>
      <p style={{ color: "var(--color-text-muted)", marginTop: 8 }}>
        <span className="genre" style={{ marginRight: 12 }}>
          {movie.genre}
        </span>
        {movie.duration} min
      </p>
      <p style={{ marginTop: 12, color: "var(--color-text-muted)", fontSize: 14 }}>
        {movie.description}
      </p>
      <h3 style={{ marginTop: 28, marginBottom: 4 }}>Select a Showtime</h3>
      <ShowtimeSelector movieId={movie.movie_id} />
    </>
  );
}
