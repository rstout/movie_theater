import type { APIGatewayProxyHandler } from "aws-lambda";
import { getSeatMap } from "../services/showtimeService";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const showId = event.pathParameters?.showId;
    if (!showId) {
      return error("showId is required", 400);
    }
    const seatMap = await getSeatMap(showId);
    if (!seatMap) {
      return error("Showtime not found", 404);
    }
    return success(seatMap);
  } catch (err: any) {
    console.error("getSeats error:", err);
    return error(err.message);
  }
};
