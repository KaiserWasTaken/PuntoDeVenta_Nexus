import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { pool } from '../../config/database.js';
import { AppError } from '../../shared/errors.js';

export async function login(email, password) {
  const result = await pool.query(`
    SELECT id, full_name, email, password_hash, role, is_active
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `, [email]);
  const user = result.rows[0];
  const validPassword = user
    ? await bcrypt.compare(password, user.password_hash)
    : false;

  if (!user || !user.is_active || !validPassword) {
    throw new AppError('Credenciales inválidas.', 401);
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    }
  };
}

export async function findUserById(id) {
  const result = await pool.query(`
    SELECT id, full_name, email, role, is_active
    FROM users
    WHERE id = $1
  `, [id]);
  return result.rows[0] ?? null;
}
