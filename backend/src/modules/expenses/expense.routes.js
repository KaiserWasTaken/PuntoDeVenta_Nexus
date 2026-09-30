import { Router } from 'express';
import { create, list } from './expense.controller.js';
import { authenticate } from '../../shared/auth.js';

export const expenseRoutes = Router();
expenseRoutes.use(authenticate);
expenseRoutes.get('/', list);
expenseRoutes.post('/', create);
