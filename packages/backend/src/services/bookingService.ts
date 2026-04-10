import { getPool } from "../utils/db";

const SEAT_PRICE = 5.0;
const LOCK_DURATION_MINUTES = 1;

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function createBooking(
  userId: string,
  showId: string,
  seatIds: string[]
) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Lock the requested seats for this showtime
    const lockResult = await client.query(
      `SELECT ss.seat_id, ss.status
       FROM showtime_seats ss
       WHERE ss.seat_id = ANY($1)
         AND ss.show_id = $2
         AND ss.status = 'AVAILABLE'
       FOR UPDATE`,
      [seatIds, showId]
    );

    // 2. Verify all requested seats are available
    if (lockResult.rows.length !== seatIds.length) {
      await client.query("ROLLBACK");
      const lockedIds = new Set(lockResult.rows.map((r: any) => r.seat_id));
      const unavailable = seatIds.filter((id) => !lockedIds.has(id));
      throw new ConflictError(
        `Seats no longer available: ${unavailable.join(", ")}`
      );
    }

    // 3. Create the booking with expiry
    const expiryTime = new Date(
      Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
    );
    const totalPrice = seatIds.length * SEAT_PRICE;

    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, show_id, status, total_price, expiry_timestamp)
       VALUES ($1, $2, 'LOCKED_PENDING_PAYMENT', $3, $4)
       RETURNING *`,
      [userId, showId, totalPrice, expiryTime]
    );

    const booking = bookingResult.rows[0];

    // 4. Update showtime_seats to LOCKED
    await client.query(
      `UPDATE showtime_seats
       SET status = 'LOCKED', booking_id = $1
       WHERE seat_id = ANY($2) AND show_id = $3`,
      [booking.booking_id, seatIds, showId]
    );

    await client.query("COMMIT");
    return booking;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function confirmBooking(bookingId: string) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock and check the booking
    const bookingResult = await client.query(
      `SELECT * FROM bookings WHERE booking_id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      throw new NotFoundError("Booking not found");
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "LOCKED_PENDING_PAYMENT") {
      await client.query("ROLLBACK");
      throw new ConflictError(
        `Cannot confirm booking with status: ${booking.status}`
      );
    }

    if (
      booking.expiry_timestamp &&
      new Date(booking.expiry_timestamp) < new Date()
    ) {
      await client.query("ROLLBACK");
      throw new ConflictError("Booking has expired");
    }

    // Update booking status
    await client.query(
      `UPDATE bookings
       SET status = 'CONFIRMED', expiry_timestamp = NULL, updated_at = NOW()
       WHERE booking_id = $1`,
      [bookingId]
    );

    // Update seats to BOOKED
    await client.query(
      `UPDATE showtime_seats
       SET status = 'BOOKED'
       WHERE booking_id = $1`,
      [bookingId]
    );

    await client.query("COMMIT");

    return { ...booking, status: "CONFIRMED", expiry_timestamp: null };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getBooking(bookingId: string) {
  const pool = getPool();

  const bookingResult = await pool.query(
    `SELECT b.*, m.movie_id, m.title AS movie_title, s.date, s.start_time,
            a.name AS auditorium_name, t.name AS theater_name
     FROM bookings b
     JOIN showtimes s ON s.show_id = b.show_id
     JOIN movies m ON m.movie_id = s.movie_id
     JOIN auditoriums a ON a.audit_id = s.audit_id
     JOIN theaters t ON t.theater_id = a.theater_id
     WHERE b.booking_id = $1`,
    [bookingId]
  );

  if (bookingResult.rows.length === 0) {
    return null;
  }

  const seatsResult = await pool.query(
    `SELECT se.seat_id, se.row_label, se.seat_number, se.type, ss.status
     FROM showtime_seats ss
     JOIN seats se ON se.seat_id = ss.seat_id
     WHERE ss.booking_id = $1
     ORDER BY se.row_label, se.seat_number`,
    [bookingId]
  );

  return {
    ...bookingResult.rows[0],
    seats: seatsResult.rows,
  };
}

export async function expireStaleBookings() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find expired bookings
    const expired = await client.query(
      `SELECT booking_id FROM bookings
       WHERE status = 'LOCKED_PENDING_PAYMENT'
         AND expiry_timestamp < NOW()
       FOR UPDATE`
    );

    if (expired.rows.length === 0) {
      await client.query("COMMIT");
      return { expiredCount: 0 };
    }

    const bookingIds = expired.rows.map((r: any) => r.booking_id);

    // Free the seats
    await client.query(
      `UPDATE showtime_seats
       SET status = 'AVAILABLE', booking_id = NULL
       WHERE booking_id = ANY($1)`,
      [bookingIds]
    );

    // Mark bookings as expired
    await client.query(
      `UPDATE bookings
       SET status = 'EXPIRED', updated_at = NOW()
       WHERE booking_id = ANY($1)`,
      [bookingIds]
    );

    await client.query("COMMIT");
    return { expiredCount: bookingIds.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
