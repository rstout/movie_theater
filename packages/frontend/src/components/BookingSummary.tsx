import type { SeatData } from "../types";

interface Props {
  selectedSeats: SeatData[];
  onBook: () => void;
  onClear: () => void;
  isBooking: boolean;
  disabled: boolean;
}

const SEAT_PRICE = 5;

export function BookingSummary({
  selectedSeats,
  onBook,
  onClear,
  isBooking,
  disabled,
}: Props) {
  if (selectedSeats.length === 0) return null;

  const total = selectedSeats.length * SEAT_PRICE;

  return (
    <div className="booking-summary">
      <h3>Your Selection</h3>
      <div className="seat-list">
        {selectedSeats.map((s) => (
          <span key={s.seat_id} className="seat-tag">
            {s.row_label}{s.seat_number}
          </span>
        ))}
      </div>
      <div className="total">${total.toFixed(2)}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-primary" onClick={onBook} disabled={isBooking || disabled}>
          {isBooking ? "Booking..." : "Book Seats"}
        </button>
        <button
          style={{ background: "var(--color-surface-hover)", color: "var(--color-text)" }}
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
