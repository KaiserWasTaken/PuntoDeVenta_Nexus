import crypto from 'node:crypto';
import { pool } from '../../config/database.js';

const sessionSelect = `
  SELECT
    s.id,
    s.consola_id,
    c.name AS consola_nombre,
    c.status AS consola_estado,
    s.tipo_renta,
    s.estado,
    s.timestamp_inicio,
    s.timestamp_fin,
    s.timestamp_pausa,
    s.timestamp_finalizacion,
    s.segundos_acumulados,
    s.duracion_segundos,
    s.precio_por_hora,
    s.monto_total,
    CASE
      WHEN s.estado = 'ACTIVA'
        THEN CASE
          WHEN s.tipo_renta = 'FIJO' THEN LEAST(
            s.duracion_segundos,
            s.segundos_acumulados
              + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.timestamp_inicio))::INTEGER
          )
          ELSE s.segundos_acumulados
            + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.timestamp_inicio))::INTEGER
        END
      ELSE s.segundos_acumulados
    END AS tiempo_transcurrido_segundos,
    CASE
      WHEN s.tipo_renta = 'FIJO' THEN GREATEST(
        s.duracion_segundos - (
          CASE
            WHEN s.estado = 'ACTIVA'
              THEN CASE
                WHEN s.tipo_renta = 'FIJO' THEN LEAST(
                  s.duracion_segundos,
                  s.segundos_acumulados
                    + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.timestamp_inicio))::INTEGER
                )
                ELSE s.segundos_acumulados
                  + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.timestamp_inicio))::INTEGER
              END
            ELSE s.segundos_acumulados
          END
        ), 0
      )
      ELSE NULL
    END AS tiempo_restante_segundos,
    ROUND((
      (
        CASE
          WHEN s.estado = 'ACTIVA'
            THEN CASE
              WHEN s.tipo_renta = 'FIJO' THEN LEAST(
                s.duracion_segundos,
                s.segundos_acumulados
                  + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.timestamp_inicio))::INTEGER
              )
              ELSE s.segundos_acumulados
                + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.timestamp_inicio))::INTEGER
            END
          ELSE s.segundos_acumulados
        END
      ) * s.precio_por_hora / 3600
    )::NUMERIC, 2) AS monto_acumulado
  FROM sesiones_tiempo s
  INNER JOIN consoles c ON c.id = s.consola_id
`;

export async function findActive() {
  const result = await pool.query(`
    ${sessionSelect}
    WHERE s.estado IN ('ACTIVA', 'PAUSADA')
    ORDER BY c.name ASC
  `);
  return result.rows;
}

export async function findExpiringFixed() {
  const result = await pool.query(`
    SELECT id, consola_id, timestamp_fin
    FROM sesiones_tiempo
    WHERE estado = 'ACTIVA'
      AND tipo_renta = 'FIJO'
      AND timestamp_fin <= CURRENT_TIMESTAMP
  `);
  return result.rows;
}

export async function findById(client, id) {
  const result = await client.query(`
    ${sessionSelect}
    WHERE s.id = $1
  `, [id]);
  return result.rows[0] ?? null;
}

export async function findSessionForUpdate(client, id) {
  const result = await client.query(`
    SELECT s.*, c.name AS consola_nombre
    FROM sesiones_tiempo s
    INNER JOIN consoles c ON c.id = s.consola_id
    WHERE s.id = $1
    FOR UPDATE OF s, c
  `, [id]);
  return result.rows[0] ?? null;
}

export async function findRentalOrderForUpdate(client, sessionId) {
  const result = await client.query(`
    SELECT o.*
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.rental_session_id = $1
      AND oi.item_type IN ('RENTAL', 'RENTAL_EXTENSION')
    ORDER BY o.created_at DESC
    LIMIT 1
    FOR UPDATE OF o
  `, [sessionId]);
  return result.rows[0] ?? null;
}

export async function findConsoleForUpdate(client, id) {
  const result = await client.query(`
    SELECT id, name, status
    FROM consoles
    WHERE id = $1 AND is_active = TRUE
    FOR UPDATE
  `, [id]);
  return result.rows[0] ?? null;
}

export async function hasOpenSession(client, consoleId) {
  const result = await client.query(`
    SELECT 1
    FROM sesiones_tiempo
    WHERE consola_id = $1 AND estado IN ('ACTIVA', 'PAUSADA')
    LIMIT 1
  `, [consoleId]);
  return result.rowCount > 0;
}

export async function create(client, data) {
  const result = await client.query(`
    INSERT INTO sesiones_tiempo (
      consola_id, tipo_renta, timestamp_inicio, timestamp_fin,
      duracion_segundos, precio_por_hora
    )
    VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)
    RETURNING id
  `, [
    data.consolaId,
    data.tipoRenta,
    data.timestampFin,
    data.duracionSegundos,
    data.precioPorHora
  ]);
  return result.rows[0].id;
}

export async function setConsoleStatus(client, consoleId, status) {
  await client.query(`
    UPDATE consoles
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [status, consoleId]);
}

export async function pause(client, id, seconds) {
  await client.query(`
    UPDATE sesiones_tiempo
    SET estado = 'PAUSADA',
        segundos_acumulados = segundos_acumulados + $2,
        timestamp_pausa = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [id, seconds]);
}

export async function resume(client, id, remainingSeconds) {
  await client.query(`
    UPDATE sesiones_tiempo
    SET estado = 'ACTIVA',
        timestamp_inicio = CURRENT_TIMESTAMP,
        timestamp_pausa = NULL,
        timestamp_fin = CASE
          WHEN tipo_renta = 'FIJO'
            THEN CURRENT_TIMESTAMP + ($2 * INTERVAL '1 second')
          ELSE NULL
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [id, remainingSeconds]);
}

export async function extend(client, id, minutes) {
  const result = await client.query(`
    UPDATE sesiones_tiempo
    SET timestamp_fin = CASE
          WHEN timestamp_fin IS NOT NULL AND timestamp_fin > CURRENT_TIMESTAMP
            THEN timestamp_fin + ($2 * INTERVAL '1 minute')
          ELSE CURRENT_TIMESTAMP + ($2 * INTERVAL '1 minute')
        END,
        duracion_segundos = COALESCE(duracion_segundos, 0) + ($2 * 60),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND estado IN ('ACTIVA', 'PAUSADA') AND tipo_renta = 'FIJO'
    RETURNING id
  `, [id, minutes]);
  return result.rowCount > 0;
}

export async function finish(client, id, seconds, amount) {
  await client.query(`
    UPDATE sesiones_tiempo
    SET estado = 'FINALIZADA',
        segundos_acumulados = segundos_acumulados + $2,
        timestamp_finalizacion = CURRENT_TIMESTAMP,
        timestamp_pausa = NULL,
        monto_total = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [id, seconds, amount]);
}

export async function createRentalOrder(client, session, amount) {
  const orderNumber = `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const orderResult = await client.query(`
    INSERT INTO orders (
      order_number, status, payment_method, subtotal, total
    )
    VALUES ($1, 'PENDING', NULL, $2, $2)
    RETURNING id, order_number, total
  `, [orderNumber, amount]);

  await client.query(`
    INSERT INTO order_items (
      order_id, rental_session_id, item_type, name_snapshot,
      quantity, unit_price, line_total, kds_status, is_kds_visible
    )
    VALUES ($1, $2, 'RENTAL', $3, 1, $4, $4, 'NOT_REQUIRED', FALSE)
  `, [
    orderResult.rows[0].id,
    session.id,
    `Renta ${session.consola_nombre}`,
    amount
  ]);

  return orderResult.rows[0];
}

export { pool };
