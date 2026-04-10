import { useShowtimes } from "../hooks/useShowtimes";
import { useNavigate } from "react-router-dom";
import type { Showtime } from "../types";

interface Props {
  movieId: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
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

  if (isLoading) return <div className="loading">Loading showtimes...</div>;
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
    <div className="showtime-list">
      {Object.entries(grouped).map(([date, shows]) => (
        <div key={date} className="showtime-date-group">
          <h3>{formatDate(date)}</h3>
          <div className="showtime-chips">
            {shows.map((st) => (
              <div
                key={st.show_id}
                className="showtime-chip"
                onClick={() => navigate(`/booking/${st.show_id}`)}
              >
                <div className="time">{formatTime(st.start_time)}</div>
                <div className="venue">
                  {st.theater_name} - {st.auditorium_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
