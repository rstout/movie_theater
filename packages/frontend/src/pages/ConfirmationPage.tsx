import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetBooking, useConfirmBooking } from "../hooks/useBooking";

export function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useGetBooking(bookingId);
  const confirmBooking = useConfirmBooking();

  if (isLoading) return <div className="loading">Loading booking...</div>;
  if (!booking) return <div className="loading">Booking not found.</div>;

  const isPending = booking.status === "LOCKED_PENDING_PAYMENT";
  const isConfirmed = booking.status === "CONFIRMED";
  const isExpired = booking.status === "EXPIRED" || booking.status === "CANCELLED";

  const statusClass = isConfirmed
    ? "confirmed"
    : isPending
      ? "pending"
      : "expired";

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

  return (
    <div className="confirmation">
      <Link to="/" className="back-link">
        &larr; Back to movies
      </Link>

      <h2 className="page-title">Booking {isConfirmed ? "Confirmed" : "Details"}</h2>
      <span className={`status-badge ${statusClass}`}>{statusLabel}</span>

      <div className="detail-card">
        <div className="detail-row">
          <span className="detail-label">Movie</span>
          <span>{booking.movie_title}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Date</span>
          <span>
            {new Date(booking.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Time</span>
          <span>{booking.start_time}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Venue</span>
          <span>
            {booking.theater_name} &mdash; {booking.auditorium_name}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Seats</span>
          <span>
            {booking.seats
              .map((s) => `${s.row_label}${s.seat_number}`)
              .join(", ")}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Total</span>
          <span style={{ fontWeight: 700 }}>
            ${parseFloat(booking.total_price).toFixed(2)}
          </span>
        </div>
      </div>

      {isPending && (
        <button
          className="btn-primary"
          style={{ marginTop: 20, padding: "12px 32px", fontSize: 16 }}
          onClick={handleConfirm}
          disabled={confirmBooking.isPending}
        >
          {confirmBooking.isPending ? "Confirming..." : "Confirm Payment"}
        </button>
      )}

      {isExpired && (
        <p style={{ marginTop: 20, color: "var(--color-text-muted)", fontSize: 14 }}>
          This booking has expired. Please try again.
        </p>
      )}
    </div>
  );
}
