import { z } from 'zod';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as repository from './report.repository.js';

export const activeMetrics = asyncHandler(async (_request, response) => {
  response.json({ data: await repository.getActiveMetrics() });
});

export const history = asyncHandler(async (_request, response) => {
  response.json({ data: await repository.listDailyReports() });
});

export const close = asyncHandler(async (request, response) => {
  const { report_date, closed_by } = z.object({
    report_date: z.string().date(),
    closed_by: z.string().uuid().nullable().optional()
  }).parse(request.body);
  const report = await repository.closeDay(report_date, closed_by || null);
  request.app.get('io').emit('cierre:actualizado', report);
  response.status(201).json({ data: report });
});
