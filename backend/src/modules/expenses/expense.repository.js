import { pool } from '../../config/database.js';

export async function createExpense(data) {
  const result = await pool.query(`
    INSERT INTO expenses (
      category, amount, description, expense_type, payment_method
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [data.category, data.amount, data.description || null, data.expense_type, data.payment_method]);
  return result.rows[0];
}

export async function listOpenExpenses() {
  const result = await pool.query(`
    SELECT *
    FROM expenses
    WHERE daily_report_id IS NULL
    ORDER BY created_at DESC
  `);
  return result.rows;
}
