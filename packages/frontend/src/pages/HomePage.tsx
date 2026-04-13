import { MovieList } from "../components/MovieList";

export function HomePage() {
  return (
    <>
      <section className="hero">
        <span className="eyebrow">Now Showing</span>
        <h1 className="display">
          Tonight at the <em>Marquee</em>
        </h1>
        <p>
          Pick a film, grab the best seats in the house, and be there when the
          lights go down. Every screen. Every showtime. Reserved in seconds.
        </p>
      </section>

      <div className="divider-marquee">
        <span>Featured Films</span>
      </div>

      <MovieList />
    </>
  );
}
