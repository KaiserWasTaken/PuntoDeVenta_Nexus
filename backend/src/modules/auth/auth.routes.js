import { Router } from 'express';
import { login, me } from './auth.controller.js';
import { authenticate } from '../../shared/auth.js';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.get('/me', authenticate, me);
