import type { APIGatewayProxyHandler } from "aws-lambda";
import { getShowtimesForMovie } from "../services/showtimeService";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const movieId = event.pathParameters?.movieId;
    if (!movieId) {
      return error("movieId is required", 400);
    }
    const showtimes = await getShowtimesForMovie(movieId);
    return success(showtimes);
  } catch (err: any) {
    console.error("getShowtimes error:", err);
    return error(err.message);
  }
};
