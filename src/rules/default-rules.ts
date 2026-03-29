import { Rule } from './engine';

/**
 * Default automation rules.
 * Edit or extend these to fit your business logic.
 */
export const defaultRules: Rule[] = [
  {
    name: 'New lead — notify admin by email',
    conditions: [],    // no conditions = always run
    actions: [{ type: 'send_admin_email' }],
    enabled: true,
  },
  {
    name: 'Lead with email — send welcome email',
    conditions: [{ field: 'email', operator: 'exists' }],
    actions: [{ type: 'send_welcome_email' }],
    enabled: true,
  },
  {
    name: 'Facebook lead — WhatsApp admin',
    conditions: [{ field: 'source', operator: 'contains', value: 'facebook' }],
    actions: [{ type: 'send_admin_whatsapp' }],
    enabled: true,
  },
  {
    name: 'All leads → HubSpot',
    conditions: [],
    actions: [{ type: 'push_to_hubspot' }],
    enabled: false,   // enable when HubSpot key is ready
  },
];
