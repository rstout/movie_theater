import { useParams, Link } from "react-router-dom";
import { useMovies } from "../hooks/useMovies";
import { ShowtimeSelector } from "../components/ShowtimeSelector";
import { posterGradient } from "../utils/posterGradient";

export function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>();
  const { data: movies, isLoading } = useMovies();

  if (isLoading) return <div className="loading">Loading…</div>;

  const movie = movies?.find((m) => m.movie_id === movieId);
  if (!movie) return <div className="loading">Movie not found.</div>;

  return (
    <>
      <Link to="/" className="back-link">
        ← Back to movies
      </Link>

      <section
        className="movie-hero"
        style={{ background: posterGradient(movie.title) }}
      >
        <span className="eyebrow">Feature Presentation</span>
        <h1>{movie.title}</h1>
        <div className="meta">
          <span className="meta-chip">{movie.genre}</span>
          <span className="meta-chip">{movie.duration} min</span>
        </div>
        <p className="description">{movie.description}</p>
      </section>

      <section className="showtime-section">
        <h2>Select a Showtime</h2>
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
          Choose any screening — you'll pick your seats next.
        </p>
        <ShowtimeSelector movieId={movie.movie_id} />
      </section>
    </>
  );
}
