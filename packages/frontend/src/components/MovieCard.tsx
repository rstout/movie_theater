import { Link } from "react-router-dom";
import type { Movie } from "../types";

interface Props {
  movie: Movie;
}

export function MovieCard({ movie }: Props) {
  return (
    <Link to={`/movies/${movie.movie_id}`} style={{ textDecoration: "none" }}>
      <div className="movie-card">
        <h3>{movie.title}</h3>
        <span className="genre">{movie.genre}</span>
        <p className="description">{movie.description}</p>
        <span className="duration">{movie.duration} min</span>
      </div>
    </Link>
  );
}
