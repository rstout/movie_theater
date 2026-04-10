import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/movie_theater";
    pool = new Pool({ connectionString, max: 10 });
  }
  return pool;
}
