const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  getUsers: () => request<import("../types").User[]>("/users"),

  getMovies: () => request<import("../types").Movie[]>("/movies"),

  getShowtimes: (movieId: string) =>
    request<import("../types").Showtime[]>(`/movies/${movieId}/showtimes`),

  getSeats: (showId: string) =>
    request<import("../types").SeatMapData>(`/showtimes/${showId}/seats`),

  createBooking: (userId: string, showId: string, seatIds: string[]) =>
    request<import("../types").Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify({ userId, showId, seatIds }),
    }),

  confirmBooking: (bookingId: string) =>
    request<import("../types").Booking>(`/bookings/${bookingId}/confirm`, {
      method: "PATCH",
    }),

  getBooking: (bookingId: string) =>
    request<import("../types").BookingDetail>(`/bookings/${bookingId}`),
};
