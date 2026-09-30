import { Router } from 'express';
import { active, extend, finish, pause, resume, start } from './session.controller.js';
import { authenticate } from '../../shared/auth.js';

export const sessionRoutes = Router();
sessionRoutes.use(authenticate);

sessionRoutes.post('/iniciar', start);
sessionRoutes.get('/activas', active);
sessionRoutes.post('/:id/pausar', pause);
sessionRoutes.post('/:id/reanudar', resume);
sessionRoutes.post('/:id/extender', extend);
sessionRoutes.post('/:id/finalizar', finish);
