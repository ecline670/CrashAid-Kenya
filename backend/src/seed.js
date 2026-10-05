import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const { ADMIN_EMAIL: email, ADMIN_PASSWORD: pw } = process.env;
if (!email || !pw) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD');
await pool.query(
  `INSERT INTO users (name,email,password_hash,role) VALUES ('Dispatcher',lower($1),$2,'admin')
   ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash`,
  [email, await bcrypt.hash(pw, 12)]);
console.log(`Dispatcher account ready: ${email}`);
process.exit(0);
