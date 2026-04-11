import { Pool } from "pg";
import { getDbSecret } from "./secrets";

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

export async function initPool(): Promise<void> {
  if (pool) return;
  if (!initPromise) {
    initPromise = (async () => {
      if (process.env.DATABASE_URL) {
        pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 10,
        });
      } else {
        const secret = await getDbSecret();
        pool = new Pool({
          host: process.env.DATABASE_HOST,
          database: process.env.DATABASE_NAME ?? "movie_theater",
          port: 5432,
          user: secret.username,
          password: secret.password,
          ssl: { rejectUnauthorized: false },
          max: 1,
        });
      }
    })();
  }
  await initPromise;
}

export function getPool(): Pool {
  if (!pool) {
    // Fallback for local dev where initPool wasn't called
    const connectionString =
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/movie_theater";
    pool = new Pool({ connectionString, max: 10 });
  }
  return pool;
}
