import { z } from 'zod';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as repository from './inventory.repository.js';

const idSchema = z.string().uuid();
const updateSchema = z.object({
  current_quantity: z.number().nonnegative().optional(),
  minimum_quantity: z.number().nonnegative().optional()
}).refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un valor para actualizar.');

export const list = asyncHandler(async (_request, response) => {
  response.json({ data: await repository.listSupplies() });
});

export const update = asyncHandler(async (request, response) => {
  const supply = await repository.updateSupply(
    idSchema.parse(request.params.id),
    updateSchema.parse(request.body)
  );
  if (!supply) return response.status(404).json({ error: 'Insumo no encontrado.' });
  request.app.get('io').emit('insumo:actualizado', supply);
  return response.json({ data: supply });
});
