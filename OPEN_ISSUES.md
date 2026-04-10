# Open Issues

Unresolved issues identified during plan review. Each needs a decision before or during implementation.

## ~~1. No authentication strategy~~ RESOLVED
No real auth. Seed 3 mock users (Alice, Bob, Charlie). Frontend shows a user picker in the header — no passwords, no JWT. `password_hash` dropped from users table. Added `GET /users` endpoint and `UserPicker.tsx` component.

## ~~2. `GET /showtimes/{id}` -- ambiguous `{id}`~~ RESOLVED
Split into `GET /movies/{movieId}/showtimes` (list showtimes, no seat data) and `GET /showtimes/{showId}/seats` (full seat map for one showtime).

## ~~3. Seat pricing is undefined~~ RESOLVED
Flat $5 per seat, hardcoded in the booking service. `price` column removed from `showtime_seats`. `bookings.total_price` = $5 x number of seats.

## ~~4. Missing endpoint to confirm payment~~ RESOLVED
Added `PATCH /bookings/{id}/confirm` — transitions LOCKED_PENDING_PAYMENT → CONFIRMED, updates `showtime_seats` status to BOOKED. Frontend shows a "Confirm Payment" button (no real payment provider).

## ~~5. Milestone 4 SSE vs Milestone 6 WebSocket is a full rewrite~~ RESOLVED
Replaced SSE/WebSocket with TanStack Query polling (`refetchInterval` 3-5s). Zero additional infrastructure, works identically in local and production. Old Milestone 4 (real-time SSE) removed; polling merged into Milestone 3. Milestones renumbered (now 6 total).

## ~~6. CORS in Lambda responses~~ RESOLVED
`response.ts` utility helpers will include `Access-Control-Allow-Origin` header in all responses. Noted in Milestone 2.

## 7. `showtime_seats.show_id` denormalization note
`show_id` could be derived via `booking_id -> bookings.show_id`, but it's on `showtime_seats` directly for the unique constraint and query performance. This is intentional -- just worth documenting.

## 8. Minor gaps
- **`.env` loading** -- how does the local Express server load `DATABASE_URL`? (dotenv?)
- **`node-pg-migrate` config** -- needs a `database.json` or programmatic config
- **Seed script idempotency** -- objective emphasizes check-before-insert; plan should note this
- **Mobile seat map** -- objective mentions zoom/pan for mobile; plan doesn't address this
