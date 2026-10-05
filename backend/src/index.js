import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { pool } from './db.js';
import { authRouter, verify } from './auth.js';
import { apiRouter } from './api.js';
import { startWorker } from './dispatch.js';
import { bootstrap } from './migrate.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
const origin = (process.env.CORS_ORIGIN || '*').split(',');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin } });

// Staff get everything; a reporter only gets updates for their own incident (room i:<id>)
const emit = (event, payload, incidentId) => {
  let t = io.to('staff');
  if (incidentId) t = t.to(`i:${incidentId}`);
  t.emit(event, payload);
};

io.use(async (socket, next) => {
  try {
    socket.data.user = await verify(socket.handshake.auth?.token);
    next();
  } catch { next(new Error('unauthorized')); }
});
io.on('connection', (socket) => {
  const u = socket.data.user;
  if (['dispatcher', 'admin'].includes(u.role)) socket.join('staff');
  socket.on('track', async (id) => {
    const { rows } = await pool.query('SELECT 1 FROM incidents WHERE id=$1 AND reporter_id=$2', [id, u.sub]);
    if (rows.length) socket.join(`i:${id}`);
  });
});

app.use(helmet());
app.use(cors({ origin }));
app.use(express.json({ limit: '50kb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api', apiRouter(emit));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

await bootstrap();
startWorker(emit);
const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`CrashAid API on :${port}`));
