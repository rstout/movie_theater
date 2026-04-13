import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useSeats(showId: string | undefined) {
  return useQuery({
    queryKey: ["seats", showId],
    queryFn: () => api.getSeats(showId!),
    enabled: !!showId,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}
