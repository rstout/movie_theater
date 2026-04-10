import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useMovies() {
  return useQuery({
    queryKey: ["movies"],
    queryFn: api.getMovies,
  });
}
