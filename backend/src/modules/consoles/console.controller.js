import { z } from 'zod';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as consoleService from './console.service.js';

const idSchema = z.string().uuid('El id debe ser un UUID válido.');
const statusSchema = z.object({
  estado: z.string().min(1, 'El estado es obligatorio.')
});

export const getConsoles = asyncHandler(async (_request, response) => {
  const consoles = await consoleService.listConsoles();
  response.json({ data: consoles });
});

export const patchConsoleStatus = asyncHandler(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  const { estado } = statusSchema.parse(request.body);
  const updatedConsole = await consoleService.changeConsoleStatus(id, estado);

  request.app.get('io').emit('consola:actualizada', updatedConsole);

  response.json({ data: updatedConsole });
});
