import pg from 'pg';
import Redis from 'ioredis';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const redis = new Redis(process.env.REDIS_URL);
// BullMQ needs its own connection with retries disabled
export const bullConn = () => new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

export async function tx(fn) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
