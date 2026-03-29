import { Lead, logLeadAction } from '../models/lead';
import { Rule, matchingRules } from '../rules/engine';
import { sendLeadEmail, sendWelcomeEmail } from './email';
import { notifyAdminWhatsApp } from './whatsapp';
import { pushToHubSpot, pushToWebhook } from './crm';
import { logger } from '../middleware/logger';

export async function runActions(lead: Lead, rules: Rule[]): Promise<void> {
  const matched = matchingRules(rules, lead);

  if (matched.length === 0) {
    logger.info('No rules matched for lead', { leadId: lead.id });
    return;
  }

  for (const rule of matched) {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'send_admin_email':
            await sendLeadEmail(lead, action.params?.to);
            break;

          case 'send_welcome_email':
            await sendWelcomeEmail(lead);
            break;

          case 'send_admin_whatsapp':
            await notifyAdminWhatsApp(lead);
            break;

          case 'push_to_hubspot':
            await pushToHubSpot(lead);
            break;

          case 'push_to_webhook':
            if (!action.params?.url) throw new Error('push_to_webhook requires params.url');
            await pushToWebhook(action.params.url, lead);
            break;

          default:
            logger.warn('Unknown action type', { type: (action as any).type });
            continue;
        }

        await logLeadAction(lead.id, action.type, 'success', `Rule: ${rule.name}`);
        logger.info('Action executed', { leadId: lead.id, action: action.type, rule: rule.name });
      } catch (err: any) {
        await logLeadAction(lead.id, action.type, 'error', err.message);
        logger.error('Action failed', { leadId: lead.id, action: action.type, error: err.message });
        // Continue with next action — don't abort the whole pipeline
      }
    }
  }
}
