import crypto from 'node:crypto';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors.js';
import { processComboSelection, validateProductModifiers } from '../catalog/catalog.service.js';

export async function createOrder({ items, createdBy }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productIds = items.filter((item) => item.product_id).map((item) => item.product_id);
    const products = await client.query(`
      SELECT id, name, sale_price
      FROM products
      WHERE id = ANY($1::uuid[]) AND is_active = TRUE
    `, [productIds]);
    const byId = new Map(products.rows.map((product) => [product.id, product]));
    if (products.rowCount !== new Set(productIds).size) {
      throw new AppError('Uno o más productos no existen o están inactivos.', 400);
    }

    const lines = [];
    for (const item of items) {
      if (item.combo_id) {
        const comboResult = await processComboSelection(
          item.combo_id, item.selected_components, client
        );
        for (const line of comboResult.lines) {
          lines.push({
            ...line,
            quantity: line.quantity * item.quantity,
            lineTotal: Number((line.line_total * item.quantity).toFixed(2))
          });
        }
        continue;
      }
      const product = byId.get(item.product_id);
      const modifierResult = await validateProductModifiers(
        product.id, item.modifiers, client
      );
      const quantity = Number(item.quantity);
      const unitPrice = Number(product.sale_price) + modifierResult.additionalTotal;
      lines.push({
        product_id: product.id,
        item_type: 'PRODUCT',
        name_snapshot: product.name,
        product,
        quantity,
        unitPrice,
        lineTotal: Number((unitPrice * quantity).toFixed(2)),
        modifiers: modifierResult.modifiers,
        kds_status: 'PENDING',
        is_kds_visible: true
      });
    }
    const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const orderNumber = `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const orderResult = await client.query(`
      INSERT INTO orders (order_number, status, payment_method, subtotal, total, created_by)
      VALUES ($1, 'PENDING', NULL, $2, $2, $3)
      RETURNING *
    `, [orderNumber, total, createdBy]);

    for (const line of lines) {
      await client.query(`
        INSERT INTO order_items (
          order_id, product_id, rental_session_id, item_type, name_snapshot, quantity,
          unit_price, line_total, kds_status, is_kds_visible, modifiers
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
      `, [
        orderResult.rows[0].id,
        line.product_id,
        line.rental_session_id ?? null,
        line.item_type,
        line.name_snapshot,
        line.quantity,
        line.unitPrice ?? line.unit_price,
        line.lineTotal,
        line.rental_session_id || ['RENTAL', 'RENTAL_EXTENSION'].includes(line.item_type)
          ? 'NOT_REQUIRED'
          : line.kds_status,
        line.rental_session_id || ['RENTAL', 'RENTAL_EXTENSION'].includes(line.item_type)
          ? false
          : line.is_kds_visible,
        JSON.stringify(line.modifiers || [])
      ]);
    }
    await client.query('COMMIT');
    return orderResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function findForUpdate(client, orderId) {
  const result = await client.query(`
    SELECT *
    FROM orders
    WHERE id = $1
    FOR UPDATE
  `, [orderId]);
  return result.rows[0] ?? null;
}

export async function listOrders() {
  const result = await pool.query(`
    SELECT id, order_number, status, payment_method, subtotal, total,
      created_at, paid_at, delivered_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 200
  `);
  return result.rows;
}

export async function hasKdsItems(client, orderId) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM order_items
      WHERE order_id = $1 AND is_kds_visible = TRUE
    ) AS has_kds_items
  `, [orderId]);
  return result.rows[0].has_kds_items;
}

export async function markAsPaid(client, orderId, paymentMethod, status) {
  const result = await client.query(`
    UPDATE orders
    SET status = $2,
        payment_method = $3,
        paid_at = CURRENT_TIMESTAMP,
        delivered_at = CASE
          WHEN $2 = 'DELIVERED' THEN CURRENT_TIMESTAMP
          ELSE delivered_at
        END
    WHERE id = $1
    RETURNING *
  `, [orderId, status, paymentMethod]);
  return result.rows[0];
}

export async function listKdsOrders() {
  const result = await pool.query(`
    SELECT
      o.id, o.order_number, o.status, o.created_at,
      COALESCE(json_agg(json_build_object(
        'id', oi.id, 'name', oi.name_snapshot, 'quantity', oi.quantity,
        'item_type', oi.item_type, 'category_name', c.name,
        'modifiers', oi.modifiers, 'kds_status', oi.kds_status,
        'is_kds_visible', oi.is_kds_visible
      ) ORDER BY oi.created_at) FILTER (
        WHERE oi.is_kds_visible = TRUE
          AND oi.kds_status IN ('PENDING', 'PREPARING')
      ), '[]') AS items
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE o.status IN ('IN_PREPARATION', 'READY')
      AND oi.is_kds_visible = TRUE
      AND oi.kds_status IN ('PENDING', 'PREPARING')
    GROUP BY o.id
    ORDER BY o.created_at ASC
  `);
  return result.rows;
}

export async function updateKdsItem(itemId, status) {
  const result = await pool.query(`
    WITH updated AS (
      UPDATE order_items
      SET kds_status = $1
      WHERE id = $2
        AND is_kds_visible = TRUE
        AND kds_status IN ('PENDING', 'PREPARING')
      RETURNING *
    ),
    order_state AS (
      SELECT
        updated.*,
        o.order_number,
        o.status AS order_status,
        NOT EXISTS (
          SELECT 1
          FROM order_items pending
          WHERE pending.order_id = updated.order_id
            AND pending.is_kds_visible = TRUE
            AND pending.kds_status <> 'READY'
        ) AS order_ready
      FROM updated
      INNER JOIN orders o ON o.id = updated.order_id
    )
    SELECT * FROM order_state
  `, [status, itemId]);
  const item = result.rows[0] ?? null;
  if (item?.order_ready) {
    await pool.query(`
      UPDATE orders
      SET status = 'DELIVERED',
          delivered_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status IN ('IN_PREPARATION', 'READY')
    `, [item.order_id]);
  }
  return item;
}
