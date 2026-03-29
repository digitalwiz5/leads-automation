import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../middleware/logger';
import { Lead } from '../models/lead';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export async function sendLeadEmail(lead: Lead, to?: string): Promise<void> {
  const recipient = to || config.admin.email;
  if (!recipient) throw new Error('No email recipient configured');

  await transporter.sendMail({
    from: config.email.from,
    to: recipient,
    subject: `New lead: ${lead.name}`,
    html: `
      <h2>New Lead Received</h2>
      <table>
        <tr><td><strong>Name</strong></td><td>${lead.name}</td></tr>
        <tr><td><strong>Email</strong></td><td>${lead.email || '—'}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${lead.phone || '—'}</td></tr>
        <tr><td><strong>Source</strong></td><td>${lead.source}</td></tr>
        <tr><td><strong>Time</strong></td><td>${new Date(lead.created_at).toLocaleString('he-IL')}</td></tr>
      </table>
      ${Object.keys(lead.data || {}).length ? `<pre>${JSON.stringify(lead.data, null, 2)}</pre>` : ''}
    `,
  });

  logger.info('Email sent', { leadId: lead.id, to: recipient });
}

export async function sendWelcomeEmail(lead: Lead): Promise<void> {
  if (!lead.email) throw new Error('Lead has no email address');

  await transporter.sendMail({
    from: config.email.from,
    to: lead.email,
    subject: 'תודה על פנייתך!',
    html: `
      <h2>שלום ${lead.name},</h2>
      <p>תודה שפנית אלינו! נחזור אליך בהקדם.</p>
    `,
  });

  logger.info('Welcome email sent', { leadId: lead.id, email: lead.email });
}
