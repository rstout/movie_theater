import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetBooking, useConfirmBooking } from "../hooks/useBooking";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useGetBooking(bookingId);
  const confirmBooking = useConfirmBooking();

  if (isLoading) return <div className="loading">Loading booking…</div>;
  if (!booking) return <div className="loading">Booking not found.</div>;

  const isPending = booking.status === "LOCKED_PENDING_PAYMENT";
  const isConfirmed = booking.status === "CONFIRMED";
  const isExpired = booking.status === "EXPIRED" || booking.status === "CANCELLED";

  const statusClass = isConfirmed ? "confirmed" : isPending ? "pending" : "expired";
  const statusLabel = isPending
    ? "Pending Payment"
    : booking.status.replace(/_/g, " ");

  const handleConfirm = () => {
    if (!bookingId) return;
    confirmBooking.mutate(bookingId, {
      onSuccess: () => {
        navigate(`/confirmation/${bookingId}/success`);
      },
    });
  };

  const seatList = booking.seats
    .map((s) => `${s.row_label}${s.seat_number}`)
    .join(" · ");

  return (
    <div className="confirmation">
      <Link to="/" className="back-link">
        ← Back to movies
      </Link>

      <div className="confirmation-center">
        <h1>{isConfirmed ? "You're all set" : "Review your booking"}</h1>
        <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="ticket-stub">
        <div className="ticket-stub-top">
          <div>
            <div className="movie-title">{booking.movie_title}</div>
            <div className="movie-sub">
              {booking.theater_name} · {booking.auditorium_name}
            </div>
          </div>
          <div className="price-block">
            <div className="label">Total</div>
            <div className="amount">
              ${parseFloat(booking.total_price).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="ticket-grid">
          <div className="field">
            <div className="label">Date</div>
            <div className="value">{formatDate(booking.date)}</div>
          </div>
          <div className="field">
            <div className="label">Showtime</div>
            <div className="value">{formatTime(booking.start_time)}</div>
          </div>
          <div className="field full">
            <div className="label">Seats</div>
            <div className="value">{seatList}</div>
          </div>
        </div>

        <div className="ticket-stub-bottom">
          <span className="booking-id">
            ID {booking.booking_id.slice(0, 8).toUpperCase()}
          </span>
          <span className="admit">Admit {booking.seats.length}</span>
        </div>
      </div>

      {isPending && (
        <div className="confirm-action">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleConfirm}
            disabled={confirmBooking.isPending}
          >
            {confirmBooking.isPending ? "Confirming…" : "Confirm Payment"}
          </button>
          <span className="hint">Seats are held for 1 minute.</span>
        </div>
      )}

      {isExpired && (
        <p
          style={{
            marginTop: 24,
            color: "var(--color-text-muted)",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          This booking has expired. Please try again.
        </p>
      )}
    </div>
  );
}
