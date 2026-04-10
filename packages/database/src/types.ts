export interface User {
  user_id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Movie {
  movie_id: string;
  title: string;
  description: string;
  duration: number;
  genre: string;
  created_at: Date;
}

export interface Theater {
  theater_id: string;
  name: string;
  address: string;
  total_capacity: number;
  created_at: Date;
}

export interface Auditorium {
  audit_id: string;
  name: string;
  theater_id: string;
  seat_count: number;
  created_at: Date;
}

export interface Seat {
  seat_id: string;
  audit_id: string;
  row_label: string;
  seat_number: number;
  type: "STANDARD" | "PREMIUM" | "VIP";
  created_at: Date;
}

export type ShowtimeSeatStatus = "AVAILABLE" | "LOCKED" | "BOOKED";

export interface Showtime {
  show_id: string;
  movie_id: string;
  audit_id: string;
  start_time: string;
  date: string;
  created_at: Date;
}

export type BookingStatus =
  | "LOCKED_PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED";

export interface Booking {
  booking_id: string;
  user_id: string;
  show_id: string;
  status: BookingStatus;
  total_price: number;
  expiry_timestamp: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShowtimeSeat {
  seat_id: string;
  show_id: string;
  status: ShowtimeSeatStatus;
  booking_id: string | null;
}
