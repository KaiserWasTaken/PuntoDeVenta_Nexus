import { z } from 'zod';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as repository from './order.repository.js';
import * as service from './order.service.js';

const orderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid().optional(),
    combo_id: z.string().uuid().optional(),
    quantity: z.number().int().positive(),
    modifiers: z.array(z.object({
      modifier_id: z.string().uuid(),
      option_ids: z.array(z.string().uuid()).default([])
    })).default([]),
    selected_components: z.array(z.object({
      combo_item_id: z.string().uuid(),
      product_id: z.string().uuid().optional(),
      quantity: z.number().int().positive().optional(),
      modifiers: z.array(z.object({
        modifier_id: z.string().uuid(),
        option_ids: z.array(z.string().uuid()).default([])
      })).default([]),
      rental: z.object({
        session_id: z.string().uuid(),
        name: z.string().trim().min(1).max(120)
      }).optional()
    })).default([])
  }).superRefine((item, context) => {
    if (!item.product_id && !item.combo_id) {
      context.addIssue({ code: 'custom', message: 'Cada línea requiere product_id o combo_id.' });
    }
    if (item.product_id && item.combo_id) {
      context.addIssue({ code: 'custom', message: 'Una línea no puede ser producto y combo al mismo tiempo.' });
    }
  })).min(1)
});

const kdsSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY'])
});

const paymentSchema = z.object({
  payment_method: z.enum(['CASH', 'CARD'])
});

export const create = asyncHandler(async (request, response) => {
  const order = await repository.createOrder({
    ...orderSchema.parse(request.body),
    createdBy: request.user.id
  });
  request.app.get('io').emit('orden:actualizada', order);
  response.status(201).json({ data: order });
});

export const list = asyncHandler(async (_request, response) => {
  response.json({ data: await repository.listOrders() });
});

export const pay = asyncHandler(async (request, response) => {
  const { payment_method: paymentMethod } = paymentSchema.parse(request.body);
  const orderId = z.string().uuid().parse(request.params.id);
  const result = await service.payOrder({
    orderId,
    paymentMethod,
    paidBy: request.user.id
  });

  const io = request.app.get('io');
  io.emit('orden:pagada', result.order);
  if (result.hasKdsItems) {
    io.emit('kds:nueva_orden', result.order);
  }
  for (const stockAlert of result.stockAlerts) {
    io.emit('insumo:stock_bajo', stockAlert);
  }

  response.json({ data: result.order });
});

export const kds = asyncHandler(async (_request, response) => {
  response.json({ data: await repository.listKdsOrders() });
});

export const updateKds = asyncHandler(async (request, response) => {
  const itemId = z.string().uuid().parse(request.params.itemId);
  const { status } = kdsSchema.parse(request.body);
  const item = await repository.updateKdsItem(itemId, status);
  if (!item) return response.status(404).json({ error: 'Ítem KDS no encontrado.' });
  const io = request.app.get('io');
  io.emit('kds:actualizado', item);
  if (item.order_ready) {
    io.emit('kds:orden_lista', item);
  }
  return response.json({ data: item });
});
