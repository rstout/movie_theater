import { useParams, Link } from "react-router-dom";
import { useGetBooking } from "../hooks/useBooking";

export function PaymentSuccessPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { data: booking, isLoading } = useGetBooking(bookingId);

  if (isLoading) return <div className="loading">Loading...</div>;
  if (!booking) return <div className="loading">Booking not found.</div>;

  return (
    <div className="confirmation">
      <h2 className="page-title">Payment Confirmed!</h2>
      <span className="status-badge confirmed">Confirmed</span>

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

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <Link to="/" className="btn-primary" style={{ padding: "10px 24px", display: "inline-block" }}>
          Browse Movies
        </Link>
        <Link to={`/movies/${booking.movie_id}`} style={{ fontSize: 14 }}>
          View Showtimes for {booking.movie_title}
        </Link>
        <Link to={`/booking/${booking.show_id}`} style={{ fontSize: 14 }}>
          View This Showtime
        </Link>
      </div>
    </div>
  );
}
