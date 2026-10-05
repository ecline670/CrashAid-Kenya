import fs from 'fs';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

// Runs on every start: creates tables on first boot, then makes sure the dispatcher login exists.
export async function bootstrap() {
  const { rows } = await pool.query(`SELECT to_regclass('public.users') AS t`);
  if (!rows[0].t) {
    const sql = fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');
    await pool.query(sql);
    console.log('Database schema created');
  }
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: pw } = process.env;
  if (email && pw) {
    const r = await pool.query(
      `INSERT INTO users (name,email,password_hash,role) VALUES ('Dispatcher',lower($1),$2,'admin') ON CONFLICT (email) DO NOTHING`,
      [email, await bcrypt.hash(pw, 12)]);
    if (r.rowCount) console.log(`Dispatcher account created: ${email}`);
  }
}
