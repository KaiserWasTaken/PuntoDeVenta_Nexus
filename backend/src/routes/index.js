import { Router } from 'express';
import { consoleRoutes } from '../modules/consoles/console.routes.js';
import { sessionRoutes } from '../modules/sessions/session.routes.js';
import { orderRoutes } from '../modules/orders/order.routes.js';
import { expenseRoutes } from '../modules/expenses/expense.routes.js';
import { reportRoutes } from '../modules/reports/report.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { catalogRoutes } from '../modules/catalog/catalog.routes.js';
import { inventoryRoutes } from '../modules/inventory/inventory.routes.js';

export const apiRouter = Router();

apiRouter.use('/consolas', consoleRoutes);
apiRouter.use('/sesiones', sessionRoutes);
apiRouter.use('/ordenes', orderRoutes);
apiRouter.use('/gastos', expenseRoutes);
apiRouter.use('/reportes', reportRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/catalogo', catalogRoutes);
apiRouter.use('/inventario', inventoryRoutes);
