import { z } from 'zod';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as repository from './expense.repository.js';

const schema = z.object({
  category: z.string().trim().min(1),
  amount: z.number().positive(),
  description: z.string().trim().max(500).optional(),
  expense_type: z.enum(['BUSINESS', 'PERSONAL']).default('BUSINESS'),
  payment_method: z.enum(['CASH', 'CREDIT', 'DEBIT']).default('CASH')
});

export const create = asyncHandler(async (request, response) => {
  const expense = await repository.createExpense(schema.parse(request.body));
  request.app.get('io').emit('gasto:actualizado', expense);
  response.status(201).json({ data: expense });
});

export const list = asyncHandler(async (_request, response) => {
  response.json({ data: await repository.listOpenExpenses() });
});
