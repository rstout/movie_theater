import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSeats } from "../hooks/useSeats";
import { useCreateBooking } from "../hooks/useBooking";
import { SeatMap } from "../components/SeatMap";
import { BookingSummary } from "../components/BookingSummary";
import type { SeatData } from "../types";

interface Props {
  userId: string | null;
}

export function BookingPage({ userId }: Props) {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useSeats(showId);
  const createBooking = useCreateBooking();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleToggleSeat = useCallback((seat: SeatData) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(seat.seat_id)) {
        next.delete(seat.seat_id);
      } else {
        next.add(seat.seat_id);
      }
      return next;
    });
  }, []);

  const handleBook = useCallback(() => {
    if (!userId || !showId || selectedIds.size === 0) return;
    setError(null);

    createBooking.mutate(
      { userId, showId, seatIds: [...selectedIds] },
      {
        onSuccess: (booking) => {
          navigate(`/confirmation/${booking.booking_id}`);
        },
        onError: (err) => {
          setError(err.message);
          setSelectedIds(new Set());
        },
      }
    );
  }, [userId, showId, selectedIds, createBooking, navigate]);

  const handleClear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  if (isLoading) return <div className="loading">Loading seat map...</div>;
  if (!data) return <div className="loading">Showtime not found.</div>;

  const { showtime, seats } = data;
  const selectedSeats = seats.filter((s) => selectedIds.has(s.seat_id));

  return (
    <>
      <Link to={`/movies/${showtime.movie_id}`} className="back-link">
        &larr; Back to showtimes
      </Link>
      <h2 className="page-title">{showtime.movie_title}</h2>
      <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: 14 }}>
        {showtime.theater_name} &mdash; {showtime.auditorium_name} &middot;{" "}
        {new Date(showtime.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}{" "}
        at {showtime.start_time}
      </p>

      {!userId && (
        <p
          style={{
            marginTop: 16,
            padding: "10px 16px",
            background: "var(--color-surface)",
            borderRadius: 8,
            fontSize: 14,
            color: "var(--color-seat-selected)",
          }}
        >
          Please select a user from the header to book seats.
        </p>
      )}

      <SeatMap
        seats={seats}
        selectedSeatIds={selectedIds}
        onToggleSeat={handleToggleSeat}
      />

      <BookingSummary
        selectedSeats={selectedSeats}
        onBook={handleBook}
        onClear={handleClear}
        isBooking={createBooking.isPending}
        disabled={!userId}
      />

      {error && <div className="error-toast">{error}</div>}
    </>
  );
}
