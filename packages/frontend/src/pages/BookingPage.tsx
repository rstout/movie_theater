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

  if (isLoading) return <BookingPageSkeleton />;
  if (!data) return <div className="loading">Showtime not found.</div>;

  const { showtime, seats } = data;
  const selectedSeats = seats.filter((s) => selectedIds.has(s.seat_id));

  const formattedDate = new Date(showtime.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="booking-page">
      <Link to={`/movies/${showtime.movie_id}`} className="back-link">
        ← Back to showtimes
      </Link>

      <header className="booking-header">
        <span className="eyebrow">Choose Your Seats</span>
        <h1 style={{ marginTop: 10 }}>{showtime.movie_title}</h1>
        <div className="subtitle">
          <span>{showtime.theater_name}</span>
          <span className="dot" />
          <span>{showtime.auditorium_name}</span>
          <span className="dot" />
          <span>{formattedDate}</span>
          <span className="dot" />
          <span>{showtime.start_time}</span>
        </div>
      </header>

      {!userId && (
        <div className="notice">
          Select a guest from the header to reserve your seats.
        </div>
      )}

      <div className="booking-layout">
        <div className="seat-map-wrap">
          <SeatMap
            seats={seats}
            selectedSeatIds={selectedIds}
            onToggleSeat={handleToggleSeat}
          />
        </div>

        <BookingSummary
          selectedSeats={selectedSeats}
          onBook={handleBook}
          onClear={handleClear}
          isBooking={createBooking.isPending}
          disabled={!userId}
        />
      </div>

      {error && <div className="error-toast">{error}</div>}
    </div>
  );
}

function BookingPageSkeleton() {
  return (
    <div className="booking-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>

      <header className="booking-header">
        <span className="eyebrow">Choose Your Seats</span>
        <div
          className="skeleton-line w-70"
          style={{ height: 28, marginTop: 14 }}
        />
        <div
          className="skeleton-line w-40"
          style={{ marginTop: 14, height: 12 }}
        />
      </header>

      <div className="booking-layout">
        <div className="seat-map-wrap">
          <div className="skeleton-seat-map">
            <div className="screen" />
            {Array.from({ length: 8 }).map((_, r) => (
              <div key={r} className="row">
                {Array.from({ length: 12 }).map((_, c) => (
                  <div key={c} className="seat" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
