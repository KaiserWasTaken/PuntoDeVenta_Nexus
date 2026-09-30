import { Router } from 'express';
import { authenticate, authorize } from '../../shared/auth.js';
import * as controller from './inventory.controller.js';

export const inventoryRoutes = Router();
inventoryRoutes.use(authenticate);
inventoryRoutes.get('/insumos', controller.list);
inventoryRoutes.patch('/insumos/:id', authorize('admin', 'manager'), controller.update);
