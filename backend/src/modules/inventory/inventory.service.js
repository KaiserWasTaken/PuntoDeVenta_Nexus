import { AppError } from '../../shared/errors.js';

export async function consumeOrderInventory(client, orderId, createdBy) {
  const itemsResult = await client.query(`
    SELECT product_id, quantity, modifiers
    FROM order_items
    WHERE order_id = $1
      AND item_type IN ('PRODUCT', 'COMBO_COMPONENT')
      AND product_id IS NOT NULL
  `, [orderId]);

  const requiredByInsumo = new Map();
  for (const item of itemsResult.rows) {
    const recipesResult = await client.query(`
      WITH selected_options AS (
        SELECT DISTINCT option_data->>'id' AS option_id
        FROM jsonb_array_elements($2::jsonb) AS modifier_data
        CROSS JOIN LATERAL jsonb_array_elements(modifier_data->'options') AS option_data
        WHERE option_data->>'id' IS NOT NULL
      ),
      required_recipes AS (
        SELECT r.insumo_id, r.quantity
        FROM recipes r
        WHERE r.product_id = $1
        UNION ALL
        SELECT mor.insumo_id, mor.quantity
        FROM modifier_option_recipes mor
        INNER JOIN selected_options so
          ON so.option_id = mor.modifier_option_id::text
      )
      SELECT rr.insumo_id, SUM(rr.quantity) AS quantity,
        i.name, i.unit
      FROM required_recipes rr
      INNER JOIN insumos i ON i.id = rr.insumo_id AND i.is_active = TRUE
      GROUP BY rr.insumo_id, i.name, i.unit
    `, [item.product_id, JSON.stringify(item.modifiers || [])]);

    for (const recipe of recipesResult.rows) {
      const consumption = Number(recipe.quantity) * Number(item.quantity);
      const current = requiredByInsumo.get(recipe.insumo_id);
      requiredByInsumo.set(recipe.insumo_id, {
        ...recipe,
        required: (current?.required || 0) + consumption
      });
    }
  }

  const stockAlerts = [];
  const requirements = [...requiredByInsumo.entries()]
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId));

  for (const [insumoId, requirement] of requirements) {
    const stockResult = await client.query(`
      SELECT id, name, unit, current_quantity, minimum_quantity
      FROM insumos
      WHERE id = $1 AND is_active = TRUE
      FOR UPDATE
    `, [insumoId]);
    const stock = stockResult.rows[0];
    if (!stock) {
      throw new AppError(`El insumo ${requirement.name} no está disponible.`, 400);
    }

    const currentQuantity = Number(stock.current_quantity);
    if (currentQuantity < requirement.required) {
      throw new AppError(
        `Stock insuficiente de ${stock.name}. Disponible: ${currentQuantity} ${stock.unit}; requerido: ${requirement.required} ${stock.unit}.`,
        400
      );
    }

    const updatedResult = await client.query(`
      UPDATE insumos
      SET current_quantity = current_quantity - $2
      WHERE id = $1
      RETURNING id, name, unit, current_quantity, minimum_quantity
    `, [insumoId, requirement.required]);
    const updated = updatedResult.rows[0];

    await client.query(`
      INSERT INTO inventory_movements (
        insumo_id, movement_type, quantity, created_by, notes
      )
      VALUES ($1, 'sale', $2, $3, $4)
    `, [
      insumoId,
      requirement.required,
      createdBy,
      `Consumo por pago de orden ${orderId}`
    ]);

    if (Number(updated.current_quantity) <= Number(updated.minimum_quantity)) {
      stockAlerts.push(updated);
    }
  }

  return { stockAlerts };
}
