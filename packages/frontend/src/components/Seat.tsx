import type { SeatData } from "../types";

interface Props {
  seat: SeatData;
  x: number;
  y: number;
  size: number;
  gap: number;
  isSelected: boolean;
  onClick: (seat: SeatData) => void;
}

function seatFill(seat: SeatData, isSelected: boolean): string {
  if (isSelected) return "var(--color-seat-selected)";
  if (seat.status === "LOCKED" || seat.status === "BOOKED")
    return "var(--color-seat-booked)";
  if (seat.type === "VIP") return "var(--color-seat-vip)";
  if (seat.type === "PREMIUM") return "var(--color-seat-premium)";
  return "var(--color-seat-available)";
}

export function Seat({ seat, x, y, size, gap, isSelected, onClick }: Props) {
  const isAvailable = seat.status === "AVAILABLE";
  const r = size - gap;

  return (
    <rect
      x={x}
      y={y}
      width={r}
      height={r}
      rx={3}
      fill={seatFill(seat, isSelected)}
      opacity={!isAvailable && !isSelected ? 0.5 : 1}
      cursor={isAvailable ? "pointer" : "not-allowed"}
      onClick={() => isAvailable && onClick(seat)}
    >
      <title>
        {seat.row_label}
        {seat.seat_number} ({seat.type}){" "}
        {isSelected ? "Selected" : seat.status}
      </title>
    </rect>
  );
}
