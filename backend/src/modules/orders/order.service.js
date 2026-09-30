import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors.js';
import { consumeOrderInventory } from '../inventory/inventory.service.js';
import * as repository from './order.repository.js';

export async function payOrder({ orderId, paymentMethod, paidBy }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const order = await repository.findForUpdate(client, orderId);

    if (!order) {
      throw new AppError('Orden no encontrada.', 404);
    }
    if (order.status !== 'PENDING') {
      throw new AppError('Solo se pueden pagar órdenes en estado PENDING.', 409);
    }

    const inventoryResult = await consumeOrderInventory(client, orderId, paidBy);
    const hasKdsItems = await repository.hasKdsItems(client, orderId);
    const updatedOrder = await repository.markAsPaid(
      client,
      orderId,
      paymentMethod,
      hasKdsItems ? 'IN_PREPARATION' : 'DELIVERED'
    );

    await client.query('COMMIT');
    return {
      order: updatedOrder,
      hasKdsItems,
      stockAlerts: inventoryResult.stockAlerts
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
