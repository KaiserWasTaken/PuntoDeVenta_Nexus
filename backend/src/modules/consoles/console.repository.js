import { pool } from '../../config/database.js';

export async function findAll() {
  const result = await pool.query(`
    SELECT id, name, status, hourly_rate, is_active, created_at, updated_at
    FROM consoles
    WHERE is_active = TRUE
    ORDER BY name ASC
  `);
  return result.rows;
}

export async function updateStatus(id, status) {
  const result = await pool.query(`
    UPDATE consoles
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND is_active = TRUE
    RETURNING id, name, status, hourly_rate, is_active, created_at, updated_at
  `, [status, id]);

  return result.rows[0] ?? null;
}
