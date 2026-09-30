import { AppError } from '../../shared/errors.js';
import * as consoleRepository from './console.repository.js';

const statusAliases = {
  LIBRE: 'available',
  OCUPADA: 'occupied',
  RESERVADA: 'reserved',
  available: 'available',
  occupied: 'occupied',
  reserved: 'reserved'
};

export function normalizeStatus(value) {
  return statusAliases[value] ?? null;
}

export async function listConsoles() {
  return consoleRepository.findAll();
}

export async function changeConsoleStatus(id, requestedStatus) {
  const status = normalizeStatus(requestedStatus);

  if (!status) {
    throw new AppError('Estado inválido. Usa LIBRE, OCUPADA o RESERVADA.', 400);
  }

  const consoleRecord = await consoleRepository.updateStatus(id, status);

  if (!consoleRecord) {
    throw new AppError('Consola no encontrada o inactiva.', 404);
  }

  return consoleRecord;
}
