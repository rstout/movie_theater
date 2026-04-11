import type { APIGatewayProxyHandler } from "aws-lambda";
import { getBooking } from "../services/bookingService";
import { initPool } from "../utils/db";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    await initPool();
    const bookingId = event.pathParameters?.id;
    if (!bookingId) {
      return error("Booking ID is required", 400);
    }

    const booking = await getBooking(bookingId);
    if (!booking) {
      return error("Booking not found", 404);
    }
    return success(booking);
  } catch (err: any) {
    console.error("getBooking error:", err);
    return error(err.message);
  }
};
