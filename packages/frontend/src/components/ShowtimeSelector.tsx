import { useShowtimes } from "../hooks/useShowtimes";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Showtime } from "../types";

interface Props {
  movieId: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
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

export function ShowtimeSelector({ movieId }: Props) {
  const { data: showtimes, isLoading } = useShowtimes(movieId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const prefetchSeats = (showId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["seats", showId],
      queryFn: () => api.getSeats(showId),
      staleTime: 10_000,
    });
  };

  if (isLoading) {
    return (
      <div className="skeleton-showtime-chips">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-chip" />
        ))}
      </div>
    );
  }
  if (!showtimes?.length)
    return <div className="loading">No showtimes available.</div>;

  // Group by date
  const grouped = showtimes.reduce<Record<string, Showtime[]>>((acc, st) => {
    const dateKey = st.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(st);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([date, shows]) => (
        <div key={date} className="showtime-date-group">
          <span className="eyebrow">{formatDate(date)}</span>
          <div className="showtime-chips">
            {shows.map((st) => (
              <button
                key={st.show_id}
                type="button"
                className="showtime-chip"
                onClick={() => navigate(`/booking/${st.show_id}`)}
                onMouseEnter={() => prefetchSeats(st.show_id)}
                onFocus={() => prefetchSeats(st.show_id)}
              >
                <div className="time">{formatTime(st.start_time)}</div>
                <div className="venue">
                  {st.theater_name} · {st.auditorium_name}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
