import { z } from 'zod';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as service from './auth.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const login = asyncHandler(async (request, response) => {
  const { email, password } = loginSchema.parse(request.body);
  response.json({ data: await service.login(email, password) });
});

export const me = asyncHandler(async (request, response) => {
  response.json({ data: request.user });
});
