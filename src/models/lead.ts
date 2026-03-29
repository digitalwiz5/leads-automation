import crypto from 'crypto';
import { query } from '../db';

export interface LeadInput {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  data?: Record<string, any>;
}

export interface Lead extends LeadInput {
  id: number;
  fingerprint: string;
  created_at: Date;
}

/** Create a dedup fingerprint from email/phone (at least one required) */
export function buildFingerprint(input: LeadInput): string {
  const key = [
    (input.email || '').toLowerCase().trim(),
    (input.phone || '').replace(/\D/g, ''),
  ].join('|');
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function findLeadByFingerprint(fingerprint: string): Promise<Lead | null> {
  const rows = await query<Lead>('SELECT * FROM leads WHERE fingerprint = $1', [fingerprint]);
  return rows[0] || null;
}

export async function saveLead(input: LeadInput): Promise<{ lead: Lead; isDuplicate: boolean }> {
  const fingerprint = buildFingerprint(input);
  const existing = await findLeadByFingerprint(fingerprint);

  if (existing) {
    return { lead: existing, isDuplicate: true };
  }

  const rows = await query<Lead>(
    `INSERT INTO leads (name, email, phone, source, data, fingerprint)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.name,
      input.email || null,
      input.phone || null,
      input.source || 'webhook',
      JSON.stringify(input.data || {}),
      fingerprint,
    ]
  );

  return { lead: rows[0], isDuplicate: false };
}

export async function logLeadAction(
  leadId: number,
  action: string,
  status: 'success' | 'error' | 'skipped',
  message?: string
): Promise<void> {
  await query(
    `INSERT INTO lead_logs (lead_id, action, status, message) VALUES ($1, $2, $3, $4)`,
    [leadId, action, status, message || null]
  );
}

export async function getLeads(limit = 50, offset = 0): Promise<Lead[]> {
  return query<Lead>('SELECT * FROM leads ORDER BY created_at DESC LIMIT $1 OFFSET $2', [
    limit,
    offset,
  ]);
}

export async function getLeadLogs(leadId: number) {
  return query(
    'SELECT * FROM lead_logs WHERE lead_id = $1 ORDER BY created_at DESC',
    [leadId]
  );
}
