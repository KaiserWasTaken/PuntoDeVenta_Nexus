import { pool } from '../../config/database.js';

export async function listSupplies() {
  const result = await pool.query(`
    SELECT id, name, unit, current_quantity, minimum_quantity, is_active
    FROM insumos
    WHERE is_active = TRUE
    ORDER BY name
  `);
  return result.rows;
}

export async function updateSupply(id, data) {
  const result = await pool.query(`
    UPDATE insumos
    SET current_quantity = COALESCE($2, current_quantity),
        minimum_quantity = COALESCE($3, minimum_quantity)
    WHERE id = $1 AND is_active = TRUE
    RETURNING id, name, unit, current_quantity, minimum_quantity, is_active
  `, [id, data.current_quantity ?? null, data.minimum_quantity ?? null]);
  return result.rows[0] ?? null;
}
