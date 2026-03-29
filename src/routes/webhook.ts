import { Router, Request, Response } from 'express';
import { webhookAuth } from '../middleware/auth';
import { saveLead } from '../models/lead';
import { runActions } from '../services/actions';
import { defaultRules } from '../rules/default-rules';
import { logger } from '../middleware/logger';

const router = Router();

/**
 * POST /webhook/lead
 *
 * Accepts a lead payload and triggers the automation pipeline.
 *
 * Body (JSON):
 *   name     string  required
 *   email    string  optional
 *   phone    string  optional
 *   source   string  optional  (e.g. "facebook", "website", "landing-page")
 *   ...any additional fields end up in lead.data
 *
 * Auth: Bearer token, X-Webhook-Secret header, or ?token= query param
 */
router.post('/lead', webhookAuth, async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, source, ...rest } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  try {
    const { lead, isDuplicate } = await saveLead({
      name: name.trim(),
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      source: source || 'webhook',
      data: rest,
    });

    if (isDuplicate) {
      logger.info('Duplicate lead ignored', { fingerprint: lead.fingerprint });
      res.status(200).json({ status: 'duplicate', leadId: lead.id });
      return;
    }

    // Run automation pipeline asynchronously — respond immediately
    setImmediate(() => runActions(lead, defaultRules));

    res.status(201).json({ status: 'created', leadId: lead.id });
  } catch (err: any) {
    logger.error('Webhook error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
