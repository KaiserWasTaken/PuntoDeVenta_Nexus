import { pool } from '../../config/database.js';

export async function getActiveMetrics() {
  const result = await pool.query(`
    SELECT
      COALESCE((
        SELECT SUM(total)
        FROM orders
        WHERE daily_report_id IS NULL
          AND paid_at IS NOT NULL
          AND status IN ('IN_PREPARATION', 'READY', 'DELIVERED')
          AND paid_at::date = CURRENT_DATE
      ), 0) AS total_sales,
      COALESCE((
        SELECT SUM(amount)
        FROM expenses
        WHERE daily_report_id IS NULL
          AND expense_date = CURRENT_DATE
      ), 0) AS total_expenses,
      COALESCE((
        SELECT SUM(total)
        FROM orders
        WHERE daily_report_id IS NULL
          AND paid_at IS NOT NULL
          AND payment_method = 'CASH'
          AND status IN ('IN_PREPARATION', 'READY', 'DELIVERED')
          AND paid_at::date = CURRENT_DATE
      ), 0) AS cash_sales,
      COALESCE((
        SELECT SUM(total)
        FROM orders
        WHERE daily_report_id IS NULL
          AND paid_at IS NOT NULL
          AND payment_method = 'CARD'
          AND status IN ('IN_PREPARATION', 'READY', 'DELIVERED')
          AND paid_at::date = CURRENT_DATE
      ), 0) AS card_sales
  `);
  const metrics = result.rows[0];
  return {
    total_sales: Number(metrics.total_sales),
    total_expenses: Number(metrics.total_expenses),
    net_profit: Number(metrics.total_sales) - Number(metrics.total_expenses),
    cash_sales: Number(metrics.cash_sales),
    card_sales: Number(metrics.card_sales)
  };
}

export async function closeDay(reportDate, closedBy = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT id FROM daily_reports WHERE report_date = $1 FOR UPDATE',
      [reportDate]
    );
    if (existing.rowCount > 0) throw new Error('El día ya tiene un cierre registrado.');

    const report = await client.query(`
      INSERT INTO daily_reports (report_date, closed_by)
      VALUES ($1, $2)
      RETURNING id
    `, [reportDate, closedBy]);
    const reportId = report.rows[0].id;

    await client.query(`
      UPDATE orders SET daily_report_id = $1
      WHERE daily_report_id IS NULL
        AND status = 'DELIVERED'
        AND created_at::date = $2
    `, [reportId, reportDate]);
    await client.query(`
      UPDATE expenses SET daily_report_id = $1
      WHERE daily_report_id IS NULL AND expense_date = $2
    `, [reportId, reportDate]);

    const totals = await client.query(`
      SELECT
        COALESCE((SELECT SUM(total) FROM orders WHERE daily_report_id = $1), 0) AS sales,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE daily_report_id = $1), 0) AS expenses,
        COALESCE((SELECT SUM(total) FROM orders WHERE daily_report_id = $1 AND payment_method = 'CASH'), 0) AS cash,
        COALESCE((SELECT SUM(total) FROM orders WHERE daily_report_id = $1 AND payment_method = 'CARD'), 0) AS card
    `, [reportId]);
    const values = totals.rows[0];
    const updated = await client.query(`
      UPDATE daily_reports
      SET total_sales = $2, total_expenses = $3, net_profit = $2 - $3,
          cash_sales = $4, card_sales = $5
      WHERE id = $1
      RETURNING *
    `, [reportId, values.sales, values.expenses, values.cash, values.card]);
    await client.query('COMMIT');
    return updated.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
