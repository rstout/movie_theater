import type { APIGatewayProxyHandler } from "aws-lambda";
import { listMovies } from "../services/movieService";
import { initPool } from "../utils/db";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    await initPool();
    const movies = await listMovies();
    return success(movies);
  } catch (err: any) {
    console.error("getMovies error:", err);
    return error(err.message);
  }
};
