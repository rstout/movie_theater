import type { APIGatewayProxyHandler } from "aws-lambda";
import { getShowtimesForMovie } from "../services/showtimeService";
import { initPool } from "../utils/db";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    await initPool();
    const movieId = event.pathParameters?.movieId;
    if (!movieId) {
      return error("movieId is required", 400);
    }
    const showtimes = await getShowtimesForMovie(movieId);
    return success(showtimes, {
      cacheControl: "public, max-age=60, stale-while-revalidate=120",
    });
  } catch (err: any) {
    console.error("getShowtimes error:", err);
    return error(err.message);
  }
};
