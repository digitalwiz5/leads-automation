import axios from 'axios';
import { config } from '../config';
import { logger } from '../middleware/logger';
import { Lead } from '../models/lead';

/**
 * Send WhatsApp message via Twilio API
 * Docs: https://www.twilio.com/docs/whatsapp/api
 */
export async function sendWhatsApp(to: string, message: string): Promise<void> {
  const { accountSid, authToken, whatsappFrom } = config.twilio;
  if (!accountSid || !authToken) throw new Error('Twilio credentials not configured');

  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const params = new URLSearchParams({
    From: whatsappFrom,
    To: toFormatted,
    Body: message,
  });

  await axios.post(url, params.toString(), {
    auth: { username: accountSid, password: authToken },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  logger.info('WhatsApp sent', { to });
}

export async function notifyAdminWhatsApp(lead: Lead): Promise<void> {
  if (!config.admin.phone) throw new Error('Admin phone not configured');

  const message =
    `🔔 ליד חדש!\n` +
    `שם: ${lead.name}\n` +
    `טלפון: ${lead.phone || '—'}\n` +
    `אימייל: ${lead.email || '—'}\n` +
    `מקור: ${lead.source}`;

  await sendWhatsApp(config.admin.phone, message);
}
