import { useParams, Link } from "react-router-dom";
import { useGetBooking } from "../hooks/useBooking";

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

export function PaymentSuccessPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { data: booking, isLoading } = useGetBooking(bookingId);

  if (isLoading) return <div className="loading">Loading…</div>;
  if (!booking) return <div className="loading">Booking not found.</div>;

  const seatList = booking.seats
    .map((s) => `${s.row_label}${s.seat_number}`)
    .join(" · ");

  return (
    <div className="confirmation">
      <div className="confirmation-center">
        <div className="success-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <span className="eyebrow">Payment Confirmed</span>
        <h1 style={{ marginTop: 10 }}>Enjoy the show</h1>
        <span className="status-badge confirmed">Confirmed</span>
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
            <div className="label">Paid</div>
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

      <div className="success-actions">
        <Link to="/" className="btn btn-primary btn-lg">
          Browse more movies
        </Link>
        <Link to={`/movies/${booking.movie_id}`} className="btn btn-ghost">
          View showtimes for {booking.movie_title}
        </Link>
        <Link to={`/booking/${booking.show_id}`} className="btn btn-ghost">
          See this showtime
        </Link>
      </div>
    </div>
  );
}
