import { getPool } from "../utils/db";

export async function listUsers() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT user_id, name, email FROM users ORDER BY name"
  );
  return result.rows;
}
