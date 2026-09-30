import { Router } from 'express';
import { activeMetrics, close, history } from './report.controller.js';
import { authenticate, authorize } from '../../shared/auth.js';

export const reportRoutes = Router();
reportRoutes.post('/cerrar', authenticate, authorize('admin', 'manager'), close);
reportRoutes.get('/metricas-activas', authenticate, activeMetrics);
reportRoutes.get('/historial', authenticate, history);
