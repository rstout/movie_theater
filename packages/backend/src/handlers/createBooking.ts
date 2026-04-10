import type { APIGatewayProxyHandler } from "aws-lambda";
import {
  createBooking,
  ConflictError,
} from "../services/bookingService";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { userId, showId, seatIds } = body;

    if (!userId || !showId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return error(
        "userId, showId, and seatIds (non-empty array) are required",
        400
      );
    }

    const booking = await createBooking(userId, showId, seatIds);
    return success(booking, 201);
  } catch (err: any) {
    if (err instanceof ConflictError) {
      return error(err.message, 409);
    }
    console.error("createBooking error:", err);
    return error(err.message);
  }
};
