export interface User {
  user_id: string;
  name: string;
  email: string;
}

export interface Movie {
  movie_id: string;
  title: string;
  description: string;
  duration: number;
  genre: string;
}

export interface Showtime {
  show_id: string;
  start_time: string;
  date: string;
  audit_id: string;
  auditorium_name: string;
  seat_count: number;
  theater_name: string;
}

export interface SeatData {
  seat_id: string;
  row_label: string;
  seat_number: number;
  type: "STANDARD" | "PREMIUM" | "VIP";
  status: "AVAILABLE" | "LOCKED" | "BOOKED";
  booking_id: string | null;
}

export interface SeatMapData {
  showtime: {
    show_id: string;
    start_time: string;
    date: string;
    movie_id: string;
    audit_id: string;
    auditorium_name: string;
    theater_name: string;
    movie_title: string;
  };
  seats: SeatData[];
}

export interface Booking {
  booking_id: string;
  user_id: string;
  show_id: string;
  status: "LOCKED_PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  total_price: string;
  expiry_timestamp: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingDetail extends Booking {
  movie_id: string;
  movie_title: string;
  date: string;
  start_time: string;
  auditorium_name: string;
  theater_name: string;
  seats: Array<{
    seat_id: string;
    row_label: string;
    seat_number: number;
    type: string;
    status: string;
  }>;
}
