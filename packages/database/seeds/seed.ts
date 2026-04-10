import pg from "pg";

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/movie_theater";

const pool = new Pool({ connectionString: DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // --- Users ---
    const users = [
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
      { name: "Charlie", email: "charlie@example.com" },
    ];
    const userIds: string[] = [];
    for (const u of users) {
      const res = await client.query(
        `INSERT INTO users (name, email)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING user_id`,
        [u.name, u.email]
      );
      userIds.push(res.rows[0].user_id);
    }
    console.log(`Seeded ${userIds.length} users`);

    // --- Theaters ---
    const theaters = [
      { name: "Downtown Cinema", address: "123 Main St, Downtown", capacity: 500 },
      { name: "Westside Multiplex", address: "456 Oak Ave, Westside", capacity: 700 },
    ];
    const theaterIds: string[] = [];
    for (const t of theaters) {
      const res = await client.query(
        `INSERT INTO theaters (name, address, total_capacity)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING theater_id`,
        [t.name, t.address, t.capacity]
      );
      if (res.rows.length > 0) {
        theaterIds.push(res.rows[0].theater_id);
      } else {
        const existing = await client.query(
          `SELECT theater_id FROM theaters WHERE name = $1`,
          [t.name]
        );
        theaterIds.push(existing.rows[0].theater_id);
      }
    }
    console.log(`Seeded ${theaterIds.length} theaters`);

    // --- Auditoriums ---
    const auditoriums = [
      { name: "Screen 1", theaterId: theaterIds[0], seatCount: 150, rows: 10, seatsPerRow: 15 },
      { name: "Screen 2", theaterId: theaterIds[0], seatCount: 120, rows: 8, seatsPerRow: 15 },
      { name: "Screen 1", theaterId: theaterIds[1], seatCount: 200, rows: 10, seatsPerRow: 20 },
      { name: "Screen 2", theaterId: theaterIds[1], seatCount: 160, rows: 8, seatsPerRow: 20 },
    ];
    const auditData: Array<{ auditId: string; rows: number; seatsPerRow: number }> = [];
    for (const a of auditoriums) {
      const res = await client.query(
        `INSERT INTO auditoriums (name, theater_id, seat_count)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING audit_id`,
        [a.name, a.theaterId, a.seatCount]
      );
      let auditId: string;
      if (res.rows.length > 0) {
        auditId = res.rows[0].audit_id;
      } else {
        const existing = await client.query(
          `SELECT audit_id FROM auditoriums WHERE name = $1 AND theater_id = $2`,
          [a.name, a.theaterId]
        );
        auditId = existing.rows[0].audit_id;
      }
      auditData.push({ auditId, rows: a.rows, seatsPerRow: a.seatsPerRow });
    }
    console.log(`Seeded ${auditData.length} auditoriums`);

    // --- Seats ---
    let totalSeats = 0;
    for (const aud of auditData) {
      for (let r = 0; r < aud.rows; r++) {
        const rowLabel = String.fromCharCode(65 + r); // A, B, C...
        for (let s = 1; s <= aud.seatsPerRow; s++) {
          // Last 2 rows are PREMIUM, first row center seats are VIP
          let seatType = "STANDARD";
          if (r >= aud.rows - 2) {
            seatType = "PREMIUM";
          } else if (r === 0 && s >= Math.floor(aud.seatsPerRow / 3) && s <= Math.ceil((2 * aud.seatsPerRow) / 3)) {
            seatType = "VIP";
          }
          await client.query(
            `INSERT INTO seats (audit_id, row_label, seat_number, type)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (audit_id, row_label, seat_number) DO NOTHING`,
            [aud.auditId, rowLabel, s, seatType]
          );
          totalSeats++;
        }
      }
    }
    console.log(`Seeded ${totalSeats} seats`);

    // --- Movies ---
    const movies = [
      { title: "The Galactic Frontier", description: "An epic space odyssey across uncharted galaxies.", duration: 148, genre: "Sci-Fi" },
      { title: "Midnight in Paris", description: "A romantic journey through the streets of Paris at night.", duration: 94, genre: "Romance" },
      { title: "The Last Heist", description: "A crew of thieves plan one final, impossible robbery.", duration: 122, genre: "Action" },
      { title: "Whispers in the Dark", description: "A psychological thriller that blurs the line between reality and nightmare.", duration: 108, genre: "Thriller" },
      { title: "Laugh Track", description: "A struggling comedian finds fame in the most unexpected way.", duration: 96, genre: "Comedy" },
      { title: "The Iron Crown", description: "A medieval epic of war, betrayal, and honor.", duration: 156, genre: "Drama" },
    ];
    const movieIds: string[] = [];
    for (const m of movies) {
      const res = await client.query(
        `INSERT INTO movies (title, description, duration, genre)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING
         RETURNING movie_id`,
        [m.title, m.description, m.duration, m.genre]
      );
      if (res.rows.length > 0) {
        movieIds.push(res.rows[0].movie_id);
      } else {
        const existing = await client.query(
          `SELECT movie_id FROM movies WHERE title = $1`,
          [m.title]
        );
        movieIds.push(existing.rows[0].movie_id);
      }
    }
    console.log(`Seeded ${movieIds.length} movies`);

    // --- Showtimes ---
    const showtimeTimes = ["10:00", "13:00", "16:00", "19:00", "21:30"];
    const today = new Date();
    let totalShowtimes = 0;
    const showIds: string[] = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split("T")[0];

      // Rotate movies across auditoriums and times
      for (let audIdx = 0; audIdx < auditData.length; audIdx++) {
        // Each auditorium gets 3-4 showtimes per day
        const timesForAud = showtimeTimes.slice(0, audIdx < 2 ? 4 : 3);
        for (let t = 0; t < timesForAud.length; t++) {
          const movieIdx = (audIdx + t + dayOffset) % movieIds.length;
          const res = await client.query(
            `INSERT INTO showtimes (movie_id, audit_id, start_time, date)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (audit_id, date, start_time) DO NOTHING
             RETURNING show_id`,
            [movieIds[movieIdx], auditData[audIdx].auditId, timesForAud[t], dateStr]
          );
          if (res.rows.length > 0) {
            showIds.push(res.rows[0].show_id);
            totalShowtimes++;
          }
        }
      }
    }
    console.log(`Seeded ${totalShowtimes} showtimes`);

    // --- Showtime Seats ---
    let totalShowtimeSeats = 0;
    for (const showId of showIds) {
      // Get the auditorium for this showtime, then insert all its seats
      const inserted = await client.query(
        `INSERT INTO showtime_seats (seat_id, show_id, status)
         SELECT s.seat_id, $1, 'AVAILABLE'
         FROM seats s
         JOIN showtimes st ON st.audit_id = s.audit_id
         WHERE st.show_id = $1
         ON CONFLICT (seat_id, show_id) DO NOTHING`,
        [showId]
      );
      totalShowtimeSeats += inserted.rowCount ?? 0;
    }
    console.log(`Seeded ${totalShowtimeSeats} showtime_seats`);

    await client.query("COMMIT");
    console.log("Seed completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
