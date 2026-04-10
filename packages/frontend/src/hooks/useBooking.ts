import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { SeatMapData } from "../types";

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      showId,
      seatIds,
    }: {
      userId: string;
      showId: string;
      seatIds: string[];
    }) => api.createBooking(userId, showId, seatIds),

    onMutate: async ({ showId, seatIds }) => {
      await queryClient.cancelQueries({ queryKey: ["seats", showId] });
      const previous = queryClient.getQueryData<SeatMapData>(["seats", showId]);

      queryClient.setQueryData<SeatMapData>(["seats", showId], (old) => {
        if (!old) return old;
        return {
          ...old,
          seats: old.seats.map((s) =>
            seatIds.includes(s.seat_id) ? { ...s, status: "LOCKED" as const } : s
          ),
        };
      });

      return { previous, showId };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous && context.showId) {
        queryClient.setQueryData(["seats", context.showId], context.previous);
      }
    },

    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["seats", variables.showId] });
    },
  });
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => api.confirmBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seats"] });
    },
  });
}

export function useGetBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => api.getBooking(bookingId!),
    enabled: !!bookingId,
  });
}
