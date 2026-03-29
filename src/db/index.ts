import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../middleware/logger';

export const pool = new Pool({
  connectionString: config.db.connectionString,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected DB error', { error: err.message });
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
