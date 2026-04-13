import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Movie } from "../types";
import { posterGradient } from "../utils/posterGradient";

interface Props {
  movie: Movie;
}

export function MovieCard({ movie }: Props) {
  const queryClient = useQueryClient();

  const prefetchShowtimes = () => {
    queryClient.prefetchQuery({
      queryKey: ["showtimes", movie.movie_id],
      queryFn: () => api.getShowtimes(movie.movie_id),
      staleTime: 30_000,
    });
  };

  return (
    <Link
      to={`/movies/${movie.movie_id}`}
      aria-label={`${movie.title} — view showtimes`}
      onMouseEnter={prefetchShowtimes}
      onFocus={prefetchShowtimes}
    >
      <article className="movie-card">
        <div
          className="poster-panel"
          style={{ background: posterGradient(movie.title) }}
        >
          <span className="poster-genre">{movie.genre}</span>
          <h3 className="poster-title">{movie.title}</h3>
        </div>
        <div className="card-body">
          <p className="description">{movie.description}</p>
          <div className="meta-row">
            <span>{movie.duration} MIN</span>
            <span className="book-cta">Book tickets →</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
