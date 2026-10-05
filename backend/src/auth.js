import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { pool, redis } from './db.js';

const secret = () => process.env.JWT_SECRET;
const sign = (u) =>
  jwt.sign({ sub: u.id, role: u.role, name: u.name }, secret(), { expiresIn: '12h', jwtid: crypto.randomUUID() });

export async function verify(token) {
  const p = jwt.verify(token, secret());
  if (await redis.get(`bl:${p.jti}`)) throw new Error('revoked');
  return p;
}

export const requireAuth = (...roles) => async (req, res, next) => {
  try {
    req.token = (req.headers.authorization || '').replace('Bearer ', '');
    req.user = await verify(req.token);
    if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export const authRouter = Router();
authRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 }));

authRouter.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password || password.length < 8)
    return res.status(400).json({ error: 'Name, email and a password of 8+ characters are required' });
  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows: [u] } = await pool.query(
      `INSERT INTO users (name,email,phone,password_hash) VALUES ($1,lower($2),$3,$4) RETURNING *`,
      [name, email, phone || null, hash]
    );
    res.status(201).json({ token: sign(u), user: pub(u) });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    throw e;
  }
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const { rows: [u] } = await pool.query('SELECT * FROM users WHERE email=lower($1)', [email || '']);
  if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: sign(u), user: pub(u) });
});

authRouter.post('/logout', requireAuth(), async (req, res) => {
  const ttl = Math.max(1, req.user.exp - Math.floor(Date.now() / 1000));
  await redis.set(`bl:${req.user.jti}`, '1', 'EX', ttl);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth(), (req, res) => res.json({ id: req.user.sub, name: req.user.name, role: req.user.role }));
