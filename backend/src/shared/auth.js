import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errors.js';
import * as authService from '../modules/auth/auth.service.js';

function readToken(request) {
  const header = request.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export async function authenticate(request, _response, next) {
  const token = readToken(request);
  if (!token) return next(new AppError('Autenticación requerida.', 401));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await authService.findUserById(payload.sub);
    if (!user?.is_active) throw new AppError('Usuario inactivo.', 401);
    request.user = user;
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Token inválido o expirado.', 401));
  }
}

export function authorize(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new AppError('No tienes permisos para esta operación.', 403));
    }
    return next();
  };
}

export function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Autenticación requerida.'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    socket.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(new Error('Token inválido o expirado.'));
  }
}
