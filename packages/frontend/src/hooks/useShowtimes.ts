import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useShowtimes(movieId: string | undefined) {
  return useQuery({
    queryKey: ["showtimes", movieId],
    queryFn: () => api.getShowtimes(movieId!),
    enabled: !!movieId,
  });
}
