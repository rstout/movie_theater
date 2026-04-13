import type { SeatData } from "../types";

interface Props {
  selectedSeats: SeatData[];
  onBook: () => void;
  onClear: () => void;
  isBooking: boolean;
  disabled: boolean;
}

const SEAT_PRICE = 5;

const TYPE_COLORS: Record<SeatData["type"], string> = {
  STANDARD: "var(--color-seat-available)",
  PREMIUM: "var(--color-seat-premium)",
  VIP: "var(--color-seat-vip)",
};

export function BookingSummary({
  selectedSeats,
  onBook,
  onClear,
  isBooking,
  disabled,
}: Props) {
  const total = selectedSeats.length * SEAT_PRICE;
  const isEmpty = selectedSeats.length === 0;

  return (
    <aside className="booking-summary">
      <span className="summary-eyebrow">Your Order</span>
      <h3>{isEmpty ? "No seats yet" : `${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""} selected`}</h3>

      {isEmpty ? (
        <p className="empty">Tap seats on the map to add them to your order.</p>
      ) : (
        <>
          <div className="seat-list">
            {selectedSeats.map((s) => (
              <span key={s.seat_id} className="seat-tag" title={s.type}>
                <span
                  className="type-dot"
                  style={{ background: TYPE_COLORS[s.type] }}
                />
                {s.row_label}
                {s.seat_number}
              </span>
            ))}
          </div>

          <div className="summary-total-row">
            <span className="label">Total</span>
            <span className="amount">${total.toFixed(2)}</span>
          </div>
        </>
      )}

      <div className="summary-actions">
        <button
          className="btn btn-primary btn-lg"
          onClick={onBook}
          disabled={isBooking || disabled || isEmpty}
        >
          {isBooking ? "Reserving…" : "Reserve Seats"}
        </button>
        {!isEmpty && (
          <button
            className="btn btn-ghost"
            onClick={onClear}
            disabled={isBooking}
          >
            Clear selection
          </button>
        )}
      </div>
    </aside>
  );
}
