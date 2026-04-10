# Movie Seat Booking Application -- Implementation Plan

## Context

Build a full-stack AWS movie seat booking application from scratch. The repo currently has only a README and `objective.txt`. The system needs a React frontend with an interactive SVG seat map, AWS Lambda backend behind API Gateway, and Aurora Serverless v2 (PostgreSQL) with row-level locking for concurrency-safe reservations. Infrastructure is defined with AWS CDK.

**Monorepo structure using npm workspaces:**
```
movie_theater/
├── package.json                 # Root workspace config
├── tsconfig.base.json
├── docker-compose.yml           # Local Postgres
├── .gitignore
├── packages/
│   ├── database/                # Migrations, seeds, shared types
│   ├── backend/                 # Lambda handlers + local Express server
│   ├── frontend/                # React + Vite + TanStack Query
│   └── infrastructure/          # AWS CDK stacks
```

---

## Milestone 1: Project Scaffolding, Database Schema, and Local Dev Environment

**Goal:** Monorepo setup, complete database schema with migrations, local PostgreSQL with seeded data.

**Deliverables:**
- Root `package.json` with workspaces, `tsconfig.base.json`, `.gitignore`, `.env.example`
- `docker-compose.yml` -- Postgres 15 on port 5432
- `packages/database/` with 8 migration files, seed script, shared client/types

**Schema (8 tables):**

| Table | Key Columns | Critical Constraints |
|-------|------------|---------------------|
| `users` | user_id (UUID), name, email | `UNIQUE(email)` |
| `movies` | movie_id, title, description, duration, genre | |
| `theaters` | theater_id, name, address, total_capacity | |
| `auditoriums` | audit_id, name, theater_id (FK), seat_count | |
| `seats` | seat_id, audit_id (FK), row_label, seat_number, type | |
| `showtimes` | show_id, movie_id (FK), audit_id (FK), start_time, date | `UNIQUE(audit_id, date, start_time)` |
| `bookings` | booking_id, user_id (FK), show_id (FK), status (ENUM), total_price, expiry_timestamp | Index on expiry for pending bookings |
| `showtime_seats` | seat_id (FK), show_id (FK), status (AVAILABLE/LOCKED/BOOKED), booking_id (nullable FK) | **`UNIQUE(seat_id, show_id)`** -- one row per seat per showtime, always |

**`showtime_seats`** is the seat inventory. Rows are bulk-inserted (status=AVAILABLE) when a showtime is created. No `booking_seats` junction table — `showtime_seats` is the single source of truth for seat state.

**Auth:** No real authentication. Seed 3 mock users (Alice, Bob, Charlie). Frontend shows a user picker (dropdown/buttons) — selecting a user sets their ID for all subsequent API requests. No passwords, no JWT, no login page.

**Seed data:** 3 mock users, 2 theaters, 4 auditoriums, ~600 seats, 6 movies, 20+ showtimes across 7 days. Showtime creation also populates `showtime_seats` for every seat in the auditorium.

**Verification:**
- `docker compose up -d` starts Postgres
- `npm run db:migrate` creates all tables
- `npm run db:seed` populates data
- Query: `SELECT count(*) FROM seats;` returns 600+

---

## Milestone 2: Backend API -- Lambda Handlers with Local Express Server

**Goal:** All API endpoints implemented and testable locally against Postgres.

**Deliverables:**
- `packages/backend/` with handlers, services, utils
- Local Express server wrapping Lambda handlers
- 7 API handlers + 1 scheduled handler

**API Endpoints:**

| Method | Endpoint | Handler | Notes |
|--------|----------|---------|-------|
| GET | /users | `getUsers.ts` | Returns 3 mock users for the user picker |
| GET | /movies | `getMovies.ts` | Movies with active showtimes |
| GET | /movies/{movieId}/showtimes | `getShowtimes.ts` | List of showtimes for a movie (date, time, auditorium) -- no seat data |
| GET | /showtimes/{showId}/seats | `getSeats.ts` | Full seat map for a single showtime (all `showtime_seats` rows) |
| POST | /bookings | `createBooking.ts` | **Transactional: BEGIN -> SELECT...FOR UPDATE -> INSERT -> COMMIT** |
| PATCH | /bookings/{id}/confirm | `confirmBooking.ts` | Transitions LOCKED_PENDING_PAYMENT -> CONFIRMED, updates `showtime_seats` status to BOOKED |
| GET | /bookings/{id} | `getBooking.ts` | Booking status with seat details |
| (scheduled) | -- | `expireStaleBookings.ts` | Expire bookings past `expiry_timestamp`, free seats |

**Critical booking transaction (`bookingService.ts`):**
1. `BEGIN`
2. `SELECT FROM showtime_seats WHERE seat_id IN (...) AND show_id = ? AND status = 'AVAILABLE' FOR UPDATE` -- lock inventory rows
3. Validate all requested seats are available (count match)
4. `INSERT INTO bookings` with status `LOCKED_PENDING_PAYMENT`, `total_price = $5 x seat count`, 10-min expiry
5. `UPDATE showtime_seats SET status = 'LOCKED', booking_id = <booking_id>` for each seat
6. `COMMIT` (or `ROLLBACK` on any failure)

**Expiry handler:** `UPDATE showtime_seats SET status = 'AVAILABLE', booking_id = NULL` for seats linked to expired bookings. Then update `bookings.status` to `EXPIRED`.

**Response helpers (`response.ts`):** `success()` and `error()` helpers return `APIGatewayProxyResult` with `Access-Control-Allow-Origin` header included.

**Verification:**
- `npm run dev -w packages/backend` starts Express on :3001
- `curl localhost:3001/movies` returns movies
- POST to /bookings creates reservation; same seats return 409 Conflict
- Expired bookings free seats

---

## Milestone 3: React Frontend -- Movie Listing, Showtime Selection, SVG Seat Map

**Goal:** Complete React UI with interactive seat map and booking flow.

**Deliverables:**
- `packages/frontend/` -- Vite + React + TypeScript
- React Router: Home, Movie, Booking, Confirmation pages
- TanStack Query for data fetching + optimistic updates
- SVG seat map (green=available, red=booked, yellow=selected)
- Polling via TanStack Query `refetchInterval` (3-5s) on the seat map query for near-real-time updates

**Key Components:**

| Component | Purpose |
|-----------|---------|
| `UserPicker.tsx` | Dropdown/buttons to select mock user (Alice, Bob, Charlie). Shown in header. Sets user ID for all API requests |
| `SeatMap.tsx` | SVG grid: `<rect>` per seat, color-coded by status, click to select |
| `Seat.tsx` | Individual seat element with hover/click handlers |
| `MovieList.tsx` / `MovieCard.tsx` | Movie browsing grid |
| `ShowtimeSelector.tsx` | Date/time picker for available showtimes |
| `BookingSummary.tsx` | Selected seats, price total, confirm button |

**Optimistic UI (`useBooking.ts`):**
- `onMutate`: optimistically mark seats as LOCKED in cache
- `onError`: rollback to previous cache state, show error
- `onSettled`: invalidate query to refetch server truth

**Vite config:** proxy `/api` to `localhost:3001`

**Verification:**
- Frontend on :5173, backend on :3001
- Browse movies -> select showtime -> SVG seat map renders correctly
- Click seats (green -> yellow), confirm booking, see confirmation
- Return to showtime: booked seats are red
- Book already-taken seats: error + UI rollback

---

## Milestone 4: AWS CDK Infrastructure

**Goal:** Complete IaC for all AWS resources. Validates via `cdk synth` (no deployment required).

**CDK Stacks:**

| Stack | Resources |
|-------|-----------|
| `vpc-stack.ts` | VPC: public, private (w/ NAT), isolated subnets across 2 AZs |
| `database-stack.ts` | Aurora Serverless v2 (PG 15, 0.5-16 ACU), Secrets Manager, RDS Proxy, security groups |
| `backend-stack.ts` | Lambda functions (NodejsFunction w/ esbuild), API Gateway REST API, EventBridge rule (1-min expiry) |
| `frontend-stack.ts` | S3 bucket + CloudFront distribution + OAC, SPA error routing |
| `migration-stack.ts` | Custom Resource Lambda running node-pg-migrate |

**Security:**
- Aurora in isolated subnets (no internet route)
- Lambdas in private subnets with NAT egress
- Security group: Lambda SG -> Aurora SG on port 5432
- IAM: Lambdas get `secretsmanager:GetSecretValue` + RDS Proxy connect
- Lambda `max: 1` connection per execution environment

**Verification:**
- `npx cdk synth` produces valid CloudFormation
- Templates contain all expected resources with correct configurations
- `npx cdk diff` shows clean plan

---

## Milestone 5: AWS Deployment

**Goal:** Deploy to AWS, adapt backend for Lambda execution, verify end-to-end in the cloud.

**Deliverables:**
- `packages/backend/src/utils/db.ts` -- dual mode: local `DATABASE_URL` or Secrets Manager + RDS Proxy
- `packages/backend/src/utils/secrets.ts` -- Secrets Manager client with module-level caching
- Frontend built with `VITE_API_URL` pointing to API Gateway
- `cdk deploy --all` succeeds

**Verification:**
- All CloudFormation stacks CREATE_COMPLETE
- `GET <api-gw>/prod/movies` returns data from Aurora
- CloudFront URL serves React app
- Full booking flow works end-to-end
- Seat map polling updates within 3-5 seconds across browsers
- Stale bookings expire after 10 minutes

---

## Milestone 6: Polish, Testing, and CI/CD

**Goal:** Harden with tests, improve UX, add CI pipeline.

**Deliverables:**
- Backend integration tests (Vitest + local Postgres)
- **Concurrency test:** 10 parallel booking attempts for same seat -> exactly 1 succeeds
- Frontend component tests (Vitest + React Testing Library)
- Loading skeletons, error boundaries, toast notifications
- `.github/workflows/ci.yml` -- lint, test, cdk synth
- Updated README with setup/deploy instructions

**Verification:**
- `npm test` passes all suites
- Concurrency test consistently proves double-booking prevention
- CI pipeline runs green
- Frontend shows loading/error states gracefully

---

## Dependency Graph

```
M1 (Scaffolding + DB)
 └─> M2 (Backend API)
      └─> M3 (Frontend UI + Polling)
           └─> M4 (CDK Infrastructure)
                └─> M5 (AWS Deployment)
                     └─> M6 (Polish + Testing)
```

## Critical Files

- `packages/database/migrations/008_create-showtime-seats.ts` -- `UNIQUE(seat_id, show_id)` inventory table, one row per seat per showtime
- `packages/backend/src/services/bookingService.ts` -- `SELECT...FOR UPDATE` transactional logic
- `packages/frontend/src/components/SeatMap.tsx` -- SVG seat map rendering
- `packages/infrastructure/lib/database-stack.ts` -- Aurora + RDS Proxy configuration
- `packages/backend/src/utils/db.ts` -- dual-mode connection (local vs. Lambda)
