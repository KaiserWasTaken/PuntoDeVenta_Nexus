import { z } from 'zod';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as service from './session.service.js';

const uuidSchema = z.string().uuid('El id debe ser un UUID válido.');
const startSchema = z.object({
  consola_id: uuidSchema,
  tipo_renta: z.enum(['LIBRE', 'FIJO']),
  duracion_minutos: z.number().int().positive().optional(),
  precio_por_hora: z.number().nonnegative()
}).superRefine((data, context) => {
  if (data.tipo_renta === 'FIJO' && data.duracion_minutos === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['duracion_minutos'],
      message: 'La duración es obligatoria para una renta FIJO.'
    });
  }
  if (data.tipo_renta === 'LIBRE' && data.duracion_minutos !== undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['duracion_minutos'],
      message: 'No envíes duración para una renta LIBRE.'
    });
  }
});

function getId(request) {
  return uuidSchema.parse(request.params.id);
}

function emitUpdate(request, session) {
  request.app.get('io').emit('sesion:actualizada', session);
}

export const start = asyncHandler(async (request, response) => {
  const data = startSchema.parse(request.body);
  const session = await service.startSession({
    consolaId: data.consola_id,
    tipoRenta: data.tipo_renta,
    duracionMinutos: data.duracion_minutos,
    precioPorHora: data.precio_por_hora
  });
  emitUpdate(request, session);
  response.status(201).json({ data: session });
});

export const pause = asyncHandler(async (request, response) => {
  const session = await service.pauseSession(getId(request));
  emitUpdate(request, session);
  response.json({ data: session });
});

export const resume = asyncHandler(async (request, response) => {
  const session = await service.resumeSession(getId(request));
  emitUpdate(request, session);
  response.json({ data: session });
});

export const finish = asyncHandler(async (request, response) => {
  const session = await service.finishSession(getId(request));
  emitUpdate(request, session);
  response.json({ data: session });
});

export const active = asyncHandler(async (_request, response) => {
  response.json({ data: await service.listActiveSessions() });
});
