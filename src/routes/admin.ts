import { Router, Request, Response } from 'express';
import { getLeads, getLeadLogs, query } from '../models/lead';

const router = Router();

// GET /admin/leads?limit=50&offset=0
router.get('/leads', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;
  const leads = await getLeads(limit, offset);
  res.json({ leads, limit, offset });
});

// GET /admin/leads/:id/logs
router.get('/leads/:id/logs', async (req: Request, res: Response) => {
  const logs = await getLeadLogs(parseInt(req.params.id));
  res.json({ logs });
});

// GET /admin/stats
router.get('/stats', async (_req: Request, res: Response) => {
  const [totals] = await query(`
    SELECT
      COUNT(*)::int                                          AS total_leads,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24h')::int AS leads_today,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7d')::int  AS leads_week
    FROM leads
  `);

  const bySource = await query(`
    SELECT source, COUNT(*)::int AS count
    FROM leads
    GROUP BY source
    ORDER BY count DESC
  `);

  const actionStats = await query(`
    SELECT action, status, COUNT(*)::int AS count
    FROM lead_logs
    GROUP BY action, status
    ORDER BY action, status
  `);

  res.json({ totals, bySource, actionStats });
});

export default router;
