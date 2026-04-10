import { getPool } from "../utils/db";

export async function listMovies() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT DISTINCT m.movie_id, m.title, m.description, m.duration, m.genre
    FROM movies m
    JOIN showtimes s ON s.movie_id = m.movie_id
    WHERE s.date >= CURRENT_DATE
    ORDER BY m.title
  `);
  return result.rows;
}
