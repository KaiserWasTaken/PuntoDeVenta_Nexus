import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors.js';
import * as repository from './session.repository.js';

function secondsSince(start) {
  return Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 1000));
}

function amountFor(seconds) {
  const minutes = Math.ceil(seconds / 60);
  if (minutes <= 30) return 25;
  if (minutes <= 60) return 35;
  return 35 + Math.ceil((minutes - 60) / 30) * 20;
}

export async function listActiveSessions() {
  return repository.findActive();
}

export async function startSession({ consolaId, tipoRenta, duracionMinutos, precioPorHora }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const consoleRecord = await repository.findConsoleForUpdate(client, consolaId);
    if (!consoleRecord) throw new AppError('Consola no encontrada o inactiva.', 404);
    if (await repository.hasOpenSession(client, consolaId)) {
      throw new AppError('La consola ya tiene una sesión abierta.', 409);
    }

    const durationSeconds = tipoRenta === 'FIJO' ? duracionMinutos * 60 : null;
    const timestampFin = durationSeconds
      ? new Date(Date.now() + durationSeconds * 1000)
      : null;
    const id = await repository.create(client, {
      consolaId,
      tipoRenta,
      duracionSegundos: durationSeconds,
      timestampFin,
      precioPorHora
    });
    await repository.setConsoleStatus(client, consolaId, 'occupied');
    const session = await repository.findById(client, id);
    await client.query('COMMIT');
    return session;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function withLockedSession(id, action) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const session = await repository.findSessionForUpdate(client, id);
    if (!session) throw new AppError('Sesión no encontrada.', 404);
    const result = await action(client, session);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function pauseSession(id) {
  return withLockedSession(id, async (client, session) => {
    if (session.estado !== 'ACTIVA') {
      throw new AppError('Solo se puede pausar una sesión activa.', 409);
    }
    const elapsed = secondsSince(session.timestamp_inicio);
    const seconds = session.tipo_renta === 'FIJO'
      ? Math.min(elapsed, session.duracion_segundos - session.segundos_acumulados)
      : elapsed;
    await repository.pause(client, id, Math.max(seconds, 0));
    return repository.findById(client, id);
  });
}

export function resumeSession(id) {
  return withLockedSession(id, async (client, session) => {
    if (session.estado !== 'PAUSADA') {
      throw new AppError('Solo se puede reanudar una sesión pausada.', 409);
    }
    const remaining = session.tipo_renta === 'FIJO'
      ? Math.max(session.duracion_segundos - session.segundos_acumulados, 0)
      : null;
    await repository.resume(client, id, remaining);
    return repository.findById(client, id);
  });
}

export function extendSession(id, minutes) {
  return withLockedSession(id, async (client, session) => {
    if (session.tipo_renta !== 'FIJO' || !['ACTIVA', 'PAUSADA'].includes(session.estado)) {
      throw new AppError('Solo se puede extender una renta fija activa o pausada.', 409);
    }
    const extended = await repository.extend(client, id, minutes);
    if (!extended) throw new AppError('No se pudo extender la sesión.', 409);
    return repository.findById(client, id);
  });
}

export function finishSession(id) {
  return withLockedSession(id, async (client, session) => {
    const existingOrder = await repository.findRentalOrderForUpdate(client, id);
    if (session.estado === 'FINALIZADA') {
      if (!existingOrder) {
        throw new AppError('La sesión ya fue finalizada.', 409);
      }
      return {
        ...(await repository.findById(client, id)),
        order_id: existingOrder.id,
        order_number: existingOrder.order_number,
        order_status: existingOrder.status
      };
    }
    if (!['ACTIVA', 'PAUSADA'].includes(session.estado)) {
      throw new AppError('La sesión no se puede finalizar en su estado actual.', 409);
    }
    const extraSeconds = session.estado === 'ACTIVA'
      ? secondsSince(session.timestamp_inicio)
      : 0;
    const elapsedSeconds = session.tipo_renta === 'FIJO'
      ? Math.min(extraSeconds, session.duracion_segundos - session.segundos_acumulados)
      : extraSeconds;
    const totalSeconds = session.segundos_acumulados + Math.max(elapsedSeconds, 0);
    const amount = amountFor(totalSeconds);
    const order = existingOrder || await repository.createRentalOrder(client, session, amount);
    await repository.finish(client, id, Math.max(elapsedSeconds, 0), amount);
    await repository.setConsoleStatus(client, session.consola_id, 'available');
    return {
      ...(await repository.findById(client, id)),
      order_id: order.id,
      order_number: order.order_number,
      order_status: order.status
    };
  });
}
