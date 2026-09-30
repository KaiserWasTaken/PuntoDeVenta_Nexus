import bcrypt from 'bcryptjs';
import { pool } from '../src/config/database.js';

const [email, password, fullName = 'Nexus Admin', role = 'admin'] = process.argv.slice(2);
const roles = new Set(['admin', 'manager', 'employee']);

if (!email || !password || !roles.has(role)) {
  console.error('Uso: node scripts/create-user.js <email> <password> [nombre] [admin|manager|employee]');
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          is_active = TRUE
    `, [fullName, email, passwordHash, role]);
    console.info(`Usuario ${email} listo con rol ${role}.`);
  } finally {
    await pool.end();
  }
}
