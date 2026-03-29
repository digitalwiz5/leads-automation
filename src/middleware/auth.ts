import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from './logger';

/**
 * Validates webhook requests via:
 * 1. Bearer token in Authorization header  OR
 * 2. ?token= query param  OR
 * 3. X-Webhook-Secret header
 */
export function webhookAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = config.webhookSecret;

  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.headers['x-webhook-secret'];
  const tokenFromQuery = req.query.token as string | undefined;

  const provided = tokenFromHeader || tokenFromQuery;

  if (!provided || provided !== secret) {
    logger.warn('Unauthorized webhook attempt', {
      ip: req.ip,
      path: req.path,
    });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
