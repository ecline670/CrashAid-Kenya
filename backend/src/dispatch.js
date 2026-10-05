import { Queue, Worker } from 'bullmq';
import { bullConn, tx } from './db.js';

export const dispatchQueue = new Queue('dispatch', { connection: bullConn() });

export const queueDispatch = (incidentId) =>
  dispatchQueue.add('assign', { incidentId }, {
    attempts: 20, backoff: { type: 'fixed', delay: 15000 }, removeOnComplete: 100, removeOnFail: 100,
  });

// Picks the nearest available ambulance (PostGIS KNN) and assigns it atomically.
export function startWorker(emit) {
  const worker = new Worker('dispatch', async ({ data }) => {
    const result = await tx(async (c) => {
      const { rows: [inc] } = await c.query(`SELECT id, status FROM incidents WHERE id=$1 FOR UPDATE`, [data.incidentId]);
      if (!inc || inc.status !== 'new') return null; // cancelled or already handled
      const { rows: [unit] } = await c.query(
        `SELECT u.id, u.callsign FROM units u, incidents i
          WHERE i.id=$1 AND u.status='available' AND u.type='ambulance' AND u.location IS NOT NULL
          ORDER BY u.location <-> i.location LIMIT 1
          FOR UPDATE OF u SKIP LOCKED`, [inc.id]);
      if (!unit) throw new Error('No available unit yet'); // retried by BullMQ backoff
      await c.query(`UPDATE units SET status='dispatched', updated_at=now() WHERE id=$1`, [unit.id]);
      await c.query(`UPDATE incidents SET status='dispatched', assigned_unit_id=$2, updated_at=now() WHERE id=$1`, [inc.id, unit.id]);
      await c.query(`INSERT INTO incident_events (incident_id, note) VALUES ($1,$2)`, [inc.id, `Auto-dispatched ${unit.callsign}`]);
      return { incidentId: inc.id, unitId: unit.id, callsign: unit.callsign };
    });
    if (result) {
      emit('incident:update', { id: result.incidentId, status: 'dispatched', assigned_unit_id: result.unitId, callsign: result.callsign }, result.incidentId);
      emit('unit:update', { id: result.unitId, status: 'dispatched' });
    }
  }, { connection: bullConn(), concurrency: 5 });
  worker.on('failed', (job, err) => console.warn(`dispatch #${job?.data?.incidentId}: ${err.message}`));
  return worker;
}
