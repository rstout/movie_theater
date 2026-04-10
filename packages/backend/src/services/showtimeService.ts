import { getPool } from "../utils/db";

export async function getShowtimesForMovie(movieId: string) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT s.show_id, s.start_time, s.date,
            a.audit_id, a.name AS auditorium_name, a.seat_count,
            t.name AS theater_name
     FROM showtimes s
     JOIN auditoriums a ON a.audit_id = s.audit_id
     JOIN theaters t ON t.theater_id = a.theater_id
     WHERE s.movie_id = $1 AND s.date >= CURRENT_DATE
     ORDER BY s.date, s.start_time`,
    [movieId]
  );
  return result.rows;
}

export async function getSeatMap(showId: string) {
  const pool = getPool();

  // Get showtime info
  const showtimeResult = await pool.query(
    `SELECT s.show_id, s.start_time, s.date, s.movie_id,
            a.audit_id, a.name AS auditorium_name,
            t.name AS theater_name,
            m.title AS movie_title
     FROM showtimes s
     JOIN auditoriums a ON a.audit_id = s.audit_id
     JOIN theaters t ON t.theater_id = a.theater_id
     JOIN movies m ON m.movie_id = s.movie_id
     WHERE s.show_id = $1`,
    [showId]
  );

  if (showtimeResult.rows.length === 0) {
    return null;
  }

  // Get all seats with their status for this showtime
  const seatsResult = await pool.query(
    `SELECT se.seat_id, se.row_label, se.seat_number, se.type,
            ss.status, ss.booking_id
     FROM showtime_seats ss
     JOIN seats se ON se.seat_id = ss.seat_id
     WHERE ss.show_id = $1
     ORDER BY se.row_label, se.seat_number`,
    [showId]
  );

  return {
    showtime: showtimeResult.rows[0],
    seats: seatsResult.rows,
  };
}
