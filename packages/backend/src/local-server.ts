import express from "express";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler as getUsersHandler } from "./handlers/getUsers";
import { handler as getMoviesHandler } from "./handlers/getMovies";
import { handler as getShowtimesHandler } from "./handlers/getShowtimes";
import { handler as getSeatsHandler } from "./handlers/getSeats";
import { handler as createBookingHandler } from "./handlers/createBooking";
import { handler as confirmBookingHandler } from "./handlers/confirmBooking";
import { handler as getBookingHandler } from "./handlers/getBooking";
import { handler as expireHandler } from "./handlers/expireStaleBookings";

const app = express();
app.use(express.json());

// Adapt Express req to a minimal APIGatewayProxyEvent
function toEvent(
  req: express.Request,
  pathParams?: Record<string, string>
): APIGatewayProxyEvent {
  return {
    body: req.body ? JSON.stringify(req.body) : null,
    headers: req.headers as Record<string, string>,
    pathParameters: pathParams ?? null,
    queryStringParameters: (req.query as Record<string, string>) ?? null,
    httpMethod: req.method,
    path: req.path,
    // Stubs for fields we don't use locally
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
  };
}

const fakeContext = {} as Context;

// Helper to wire a Lambda handler to an Express route
function route(
  method: "get" | "post" | "patch",
  path: string,
  handler: Function,
  paramMap?: (params: Record<string, string>) => Record<string, string>
) {
  app[method](path, async (req, res) => {
    const pathParams = paramMap ? paramMap(req.params) : req.params;
    const event = toEvent(req, pathParams);
    const result = await (handler as any)(event, fakeContext, () => {});
    res.status(result.statusCode);
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value as string);
      }
    }
    res.send(result.body);
  });
}

// Routes
route("get", "/users", getUsersHandler);
route("get", "/movies", getMoviesHandler);
route("get", "/movies/:movieId/showtimes", getShowtimesHandler);
route("get", "/showtimes/:showId/seats", getSeatsHandler, (p) => ({
  showId: p.showId,
}));
route("post", "/bookings", createBookingHandler);
route("patch", "/bookings/:id/confirm", confirmBookingHandler);
route("get", "/bookings/:id", getBookingHandler);

// Manual trigger for expiry (for testing)
app.post("/admin/expire", async (_req, res) => {
  await (expireHandler as any)({}, fakeContext, () => {});
  res.json({ ok: true });
});

// Expire stale bookings every 15 seconds
setInterval(async () => {
  try {
    await (expireHandler as any)({}, fakeContext, () => {});
  } catch (err) {
    console.error("Auto-expire error:", err);
  }
}, 15_000);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
