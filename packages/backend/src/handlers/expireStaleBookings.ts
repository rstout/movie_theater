import type { ScheduledHandler } from "aws-lambda";
import { expireStaleBookings } from "../services/bookingService";

export const handler: ScheduledHandler = async () => {
  try {
    const result = await expireStaleBookings();
    console.log(`Expired ${result.expiredCount} stale bookings`);
  } catch (err) {
    console.error("expireStaleBookings error:", err);
    throw err;
  }
};
