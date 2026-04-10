import type { SeatData } from "../types";
import { Seat } from "./Seat";

interface Props {
  seats: SeatData[];
  selectedSeatIds: Set<string>;
  onToggleSeat: (seat: SeatData) => void;
}

const SEAT_SIZE = 32;
const GAP = 4;
const ROW_LABEL_WIDTH = 24;
const PADDING = 8;

export function SeatMap({ seats, selectedSeatIds, onToggleSeat }: Props) {
  // Group seats by row, sort rows alphabetically and seats by number
  const rows = new Map<string, SeatData[]>();
  for (const seat of seats) {
    const row = rows.get(seat.row_label) ?? [];
    row.push(seat);
    rows.set(seat.row_label, row);
  }

  const sortedRows = [...rows.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, rowSeats]) => ({
      label,
      seats: rowSeats.sort((a, b) => a.seat_number - b.seat_number),
    }));

  const maxCols = Math.max(...sortedRows.map((r) => r.seats.length));
  const svgWidth = ROW_LABEL_WIDTH + maxCols * SEAT_SIZE + PADDING * 2;
  const svgHeight = sortedRows.length * SEAT_SIZE + PADDING * 2;

  return (
    <div className="seat-map-container">
      <div className="screen-indicator">Screen</div>

      <svg
        className="seat-map-svg"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {sortedRows.map((row, rowIdx) => {
          const y = PADDING + rowIdx * SEAT_SIZE;
          return (
            <g key={row.label}>
              <text
                x={PADDING}
                y={y + SEAT_SIZE / 2}
                dominantBaseline="central"
                fill="var(--color-text-muted)"
                fontSize={12}
                fontWeight={600}
              >
                {row.label}
              </text>
              {row.seats.map((seat) => {
                const x =
                  PADDING + ROW_LABEL_WIDTH + (seat.seat_number - 1) * SEAT_SIZE;
                return (
                  <Seat
                    key={seat.seat_id}
                    seat={seat}
                    x={x}
                    y={y}
                    size={SEAT_SIZE}
                    gap={GAP}
                    isSelected={selectedSeatIds.has(seat.seat_id)}
                    onClick={onToggleSeat}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="seat-legend">
        <div className="seat-legend-item">
          <div
            className="seat-legend-dot"
            style={{ background: "var(--color-seat-available)" }}
          />
          Available
        </div>
        <div className="seat-legend-item">
          <div
            className="seat-legend-dot"
            style={{ background: "var(--color-seat-selected)" }}
          />
          Selected
        </div>
        <div className="seat-legend-item">
          <div
            className="seat-legend-dot"
            style={{ background: "var(--color-seat-booked)", opacity: 0.5 }}
          />
          Taken
        </div>
        <div className="seat-legend-item">
          <div
            className="seat-legend-dot"
            style={{ background: "var(--color-seat-vip)" }}
          />
          VIP
        </div>
        <div className="seat-legend-item">
          <div
            className="seat-legend-dot"
            style={{ background: "var(--color-seat-premium)" }}
          />
          Premium
        </div>
      </div>
    </div>
  );
}
