import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../middleware/logger';

const router = Router();

const FB_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || '';
const FB_PAGE_TOKEN   = process.env.FB_PAGE_TOKEN || '';

// ── GET: Facebook verification handshake ──────────────────────────────────
// Facebook שולח GET פעם אחת כשמגדירים את ה-Webhook.
// צריך להחזיר את hub.challenge כדי לאמת את ה-URL.
router.get('/', (req: Request, res: Response): void => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
    logger.info('Facebook webhook verified');
    res.send(challenge);
    return;
  }

  logger.warn('Facebook webhook verification failed', { token });
  res.sendStatus(403);
});

// ── POST: קבלת ליד חדש מ-Facebook Lead Ads ───────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { object, entry } = req.body;

  // מאשרים מיד ל-Facebook (דרישה שלהם — לא לחכות יותר מ-5 שניות)
  res.sendStatus(200);

  if (object !== 'page') return;

  for (const pageEntry of entry ?? []) {
    for (const change of pageEntry.changes ?? []) {
      if (change.field !== 'leadgen') continue;

      const leadgenId = change.value?.leadgen_id;
      const formId    = change.value?.form_id;

      try {
        // שליפת נתוני הליד המלאים מ-Graph API
        const fbRes = await axios.get<{ field_data: { name: string; values: string[] }[] }>(
          `https://graph.facebook.com/v18.0/${leadgenId}`,
          { params: { access_token: FB_PAGE_TOKEN } }
        );

        // המרה ל-object שטוח
        const fields: Record<string, string> = {};
        for (const { name, values } of fbRes.data.field_data) {
          fields[name] = values[0];
        }

        const name =
          fields['full_name'] ||
          [fields['first_name'], fields['last_name']].filter(Boolean).join(' ') ||
          'Unknown';

        // שליחה ל-Webhook הפנימי שלנו
        await axios.post(
          `http://localhost:${config.port}/webhook/lead`,
          {
            name,
            email:  fields['email'],
            phone:  fields['phone_number'],
            source: 'facebook-lead-ads',
            data:   { leadgen_id: leadgenId, form_id: formId, ...fields },
          },
          { headers: { Authorization: `Bearer ${config.webhookSecret}` } }
        );

        logger.info('Facebook lead forwarded', { leadgenId, name });
      } catch (err: any) {
        logger.error('Facebook bridge error', { leadgenId, error: err.message });
      }
    }
  }
});

export default router;
