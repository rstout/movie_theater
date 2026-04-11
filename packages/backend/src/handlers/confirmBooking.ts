import type { APIGatewayProxyHandler } from "aws-lambda";
import {
  confirmBooking,
  ConflictError,
  NotFoundError,
} from "../services/bookingService";
import { initPool } from "../utils/db";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    await initPool();
    const bookingId = event.pathParameters?.id;
    if (!bookingId) {
      return error("Booking ID is required", 400);
    }

    const booking = await confirmBooking(bookingId);
    return success(booking);
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      return error(err.message, 404);
    }
    if (err instanceof ConflictError) {
      return error(err.message, 409);
    }
    console.error("confirmBooking error:", err);
    return error(err.message);
  }
};
