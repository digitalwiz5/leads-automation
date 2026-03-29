import { pool } from './index';
import { logger } from '../middleware/logger';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS leads (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    source      TEXT DEFAULT 'unknown',
    data        JSONB DEFAULT '{}',
    fingerprint TEXT NOT NULL UNIQUE,   -- for dedup
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS lead_logs (
    id          SERIAL PRIMARY KEY,
    lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    action      TEXT NOT NULL,
    status      TEXT NOT NULL,           -- 'success' | 'error' | 'skipped'
    message     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_leads_fingerprint ON leads(fingerprint);
  CREATE INDEX IF NOT EXISTS idx_leads_source      ON leads(source);
  CREATE INDEX IF NOT EXISTS idx_lead_logs_lead_id ON lead_logs(lead_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(SCHEMA);
    logger.info('Database migration completed successfully');
  } catch (err: any) {
    logger.error('Migration failed', { error: err.message });
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
