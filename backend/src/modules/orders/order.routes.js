import { Router } from 'express';
import { create, kds, list, pay, updateKds } from './order.controller.js';
import { authenticate } from '../../shared/auth.js';

export const orderRoutes = Router();
orderRoutes.use(authenticate);

orderRoutes.post('/', create);
orderRoutes.get('/', list);
orderRoutes.post('/:id/pagar', pay);
orderRoutes.get('/kds', kds);
orderRoutes.patch('/kds/:itemId', updateKds);
orderRoutes.patch('/kds/items/:itemId', updateKds);
