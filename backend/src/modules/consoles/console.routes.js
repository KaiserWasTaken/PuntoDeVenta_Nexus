import { Router } from 'express';
import { getConsoles, patchConsoleStatus } from './console.controller.js';
import { authenticate } from '../../shared/auth.js';

export const consoleRoutes = Router();

consoleRoutes.get('/', getConsoles);
consoleRoutes.patch('/:id/estado', authenticate, patchConsoleStatus);
