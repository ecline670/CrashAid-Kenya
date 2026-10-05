import { Router } from 'express';
import { pool, tx } from './db.js';
import { requireAuth } from './auth.js';
import { queueDispatch } from './dispatch.js';

const STATUSES = ['new', 'dispatched', 'en_route', 'on_scene', 'resolved', 'cancelled'];
const INC = `SELECT i.id, i.description, i.severity, i.status, i.created_at, i.updated_at, i.assigned_unit_id,
  u.callsign, r.name AS reporter, r.phone, ST_Y(i.location::geometry) AS lat, ST_X(i.location::geometry) AS lng
  FROM incidents i LEFT JOIN units u ON u.id=i.assigned_unit_id LEFT JOIN users r ON r.id=i.reporter_id`;
const validCoords = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export function apiRouter(emit) {
  const r = Router();
  const staff = requireAuth('dispatcher', 'admin');

  // Victim (or anyone signed in) raises an SOS
  r.post('/incidents', requireAuth(), async (req, res) => {
    const lat = Number(req.body.lat), lng = Number(req.body.lng);
    if (req.body.lat == null || req.body.lng == null || !validCoords(lat, lng))
      return res.status(400).json({ error: 'Valid lat/lng required' });
    const severity = ['minor', 'serious', 'critical'].includes(req.body.severity) ? req.body.severity : 'unknown';
    const description = String(req.body.description || '').slice(0, 500);
    const id = await tx(async (c) => {
      const { rows: [row] } = await c.query(
        `INSERT INTO incidents (reporter_id, description, severity, location)
         VALUES ($1,$2,$3, ST_MakePoint($5,$4)::geography) RETURNING id`, [req.user.sub, description, severity, lat, lng]);
      await c.query(`INSERT INTO incident_events (incident_id, actor_id, note) VALUES ($1,$2,'SOS received')`, [row.id, req.user.sub]);
      return row.id;
    });
    const { rows: [inc] } = await pool.query(`${INC} WHERE i.id=$1`, [id]);
    await queueDispatch(id);
    emit('incident:new', inc, id);
    res.status(201).json(inc);
  });

  r.get('/incidents', staff, async (_req, res) => {
    const { rows } = await pool.query(`${INC} ORDER BY i.created_at DESC LIMIT 200`);
    res.json(rows);
  });

  r.get('/incidents/:id', requireAuth(), async (req, res) => {
    const { rows: [inc] } = await pool.query(`${INC} WHERE i.id=$1`, [req.params.id]);
    if (!inc) return res.status(404).json({ error: 'Not found' });
    const { rows: mine } = await pool.query('SELECT 1 FROM incidents WHERE id=$1 AND reporter_id=$2', [inc.id, req.user.sub]);
    if (!mine.length && !['dispatcher', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const { rows: events } = await pool.query('SELECT note, created_at FROM incident_events WHERE incident_id=$1 ORDER BY id', [inc.id]);
    res.json({ ...inc, events });
  });

  r.patch('/incidents/:id/status', staff, async (req, res) => {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const out = await tx(async (c) => {
      const { rows: [i] } = await c.query(
        `UPDATE incidents SET status=$1, updated_at=now() WHERE id=$2 RETURNING id, status, assigned_unit_id`, [status, req.params.id]);
      if (!i) return null;
      await c.query(`INSERT INTO incident_events (incident_id, actor_id, note) VALUES ($1,$2,$3)`, [i.id, req.user.sub, `Status set to ${status}`]);
      let unit = null;
      if (['resolved', 'cancelled'].includes(status) && i.assigned_unit_id) {
        await c.query(`UPDATE units SET status='available', updated_at=now() WHERE id=$1`, [i.assigned_unit_id]);
        unit = { id: i.assigned_unit_id, status: 'available' };
      }
      return { i, unit };
    });
    if (!out) return res.status(404).json({ error: 'Not found' });
    emit('incident:update', { id: out.i.id, status: out.i.status }, out.i.id);
    if (out.unit) emit('unit:update', out.unit);
    res.json(out.i);
  });

  r.get('/units', staff, async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.callsign, u.type, u.status, u.updated_at, p.name AS provider,
              ST_Y(u.location::geometry) AS lat, ST_X(u.location::geometry) AS lng
       FROM units u LEFT JOIN providers p ON p.id=u.provider_id ORDER BY u.callsign`);
    res.json(rows);
  });

  r.patch('/units/:id/location', staff, async (req, res) => {
    const lat = Number(req.body.lat), lng = Number(req.body.lng);
    if (!validCoords(lat, lng)) return res.status(400).json({ error: 'Valid lat/lng required' });
    const { rows: [u] } = await pool.query(
      `UPDATE units SET location=ST_MakePoint($3,$2)::geography, updated_at=now() WHERE id=$1 RETURNING id`, [req.params.id, lat, lng]);
    if (!u) return res.status(404).json({ error: 'Not found' });
    emit('unit:update', { id: u.id, lat, lng });
    res.json({ ok: true });
  });

  r.get('/providers', staff, async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT id, name, phone, type, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng FROM providers ORDER BY type, name`);
    res.json(rows);
  });

  return r;
}
