import axios from 'axios';
import { config } from '../config';
import { logger } from '../middleware/logger';
import { Lead } from '../models/lead';

/**
 * Push lead to HubSpot CRM
 * Docs: https://developers.hubspot.com/docs/api/crm/contacts
 */
export async function pushToHubSpot(lead: Lead): Promise<string> {
  if (!config.hubspot.apiKey) throw new Error('HubSpot API key not configured');

  const response = await axios.post(
    'https://api.hubapi.com/crm/v3/objects/contacts',
    {
      properties: {
        firstname: lead.name.split(' ')[0],
        lastname: lead.name.split(' ').slice(1).join(' ') || '',
        email: lead.email || '',
        phone: lead.phone || '',
        leadsource: lead.source,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${config.hubspot.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const contactId = response.data.id;
  logger.info('Lead pushed to HubSpot', { leadId: lead.id, contactId });
  return contactId;
}

/**
 * Generic webhook push — send lead to any external URL
 */
export async function pushToWebhook(url: string, lead: Lead): Promise<void> {
  await axios.post(url, {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    data: lead.data,
    created_at: lead.created_at,
  });
  logger.info('Lead pushed to external webhook', { leadId: lead.id, url });
}
